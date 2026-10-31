import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const mocks = vi.hoisted(() => ({
  poolQuery: vi.fn(),
  verifyIdToken: vi.fn(),
}));

vi.mock("../db.js", () => ({
  default: { query: mocks.poolQuery },
}));

vi.mock("../firebaseAdmin.js", () => ({
  default: {
    auth: () => ({ verifyIdToken: mocks.verifyIdToken }),
  },
}));

import app from "../server.js";

const AUTH_USER = {
  uid: "test-uid-123",
  email: "teste@email.com",
};

const authHeader = { Authorization: "Bearer fake-token" };

describe("POST /users - caracterização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.poolQuery.mockReset();
    mocks.verifyIdToken.mockReset();
    mocks.verifyIdToken.mockResolvedValue(AUTH_USER);
  });

  it("cria um usuário novo usando e-mail e UID do token", async () => {
    const createdUser = {
      id: 1,
      name: "Eduardo",
      email: AUTH_USER.email,
      firebase_uid: AUTH_USER.uid,
    };

    mocks.poolQuery.mockResolvedValueOnce({ rows: [createdUser] });

    const res = await request(app)
      .post("/users")
      .set(authHeader)
      .send({ name: "Eduardo" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(createdUser);
    expect(mocks.poolQuery).toHaveBeenCalledTimes(1);

    const [sql, params] = mocks.poolQuery.mock.calls[0];
    expect(sql).toContain("INSERT INTO users");
    expect(sql).toContain("ON CONFLICT (firebase_uid) DO UPDATE");
    expect(sql).toContain("RETURNING *");
    expect(params).toEqual(["Eduardo", AUTH_USER.email, AUTH_USER.uid]);
  });

  it("retorna o usuário existente quando o firebase_uid já está cadastrado", async () => {
    const existingUser = {
      id: 2,
      name: "Usuário Existente",
      email: AUTH_USER.email,
      firebase_uid: AUTH_USER.uid,
    };

    mocks.poolQuery.mockResolvedValueOnce({ rows: [existingUser] });

    const res = await request(app)
      .post("/users")
      .set(authHeader)
      .send({ name: "Nome Ignorado" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(existingUser);
    expect(mocks.poolQuery).toHaveBeenCalledTimes(1);
  });

  it("ignora email e uid enviados no body, usando os dados do token", async () => {
    mocks.poolQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 3,
          name: "Eduardo",
          email: AUTH_USER.email,
          firebase_uid: AUTH_USER.uid,
        },
      ],
    });

    const res = await request(app).post("/users").set(authHeader).send({
      name: "Eduardo",
      email: "outro@email.com",
      uid: "outro-uid",
    });

    expect(res.status).toBe(200);
    expect(mocks.poolQuery.mock.calls[0][1]).toEqual([
      "Eduardo",
      AUTH_USER.email,
      AUTH_USER.uid,
    ]);
  });

  it("retorna 401 quando o token é inválido", async () => {
    mocks.verifyIdToken.mockRejectedValueOnce(new Error("Token expirado"));

    const res = await request(app)
      .post("/users")
      .set(authHeader)
      .send({ name: "Eduardo" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Token inválido" });
    expect(mocks.poolQuery).not.toHaveBeenCalled();
  });

  it("caracteriza conflito de e-mail único como erro 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.poolQuery.mockRejectedValueOnce(
      Object.assign(
        new Error(
          'duplicate key value violates unique constraint "users_email_key"'
        ),
        { code: "23505" }
      )
    );

    const res = await request(app)
      .post("/users")
      .set(authHeader)
      .send({ name: "Eduardo" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erro ao salvar usuário" });
  });

  it("retorna 500 quando ocorre falha inesperada no banco", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.poolQuery.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await request(app)
      .post("/users")
      .set(authHeader)
      .send({ name: "Eduardo" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erro ao salvar usuário" });
  });
});
