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
  email_verified: false,
};

const DB_USER = {
  id: 1,
  name: "Eduardo",
  email: AUTH_USER.email,
  firebase_uid: AUTH_USER.uid,
};

const authHeader = { Authorization: "Bearer fake-token" };

const syncUser = (body = { name: "Eduardo" }) =>
  request(app).post("/users").set(authHeader).send(body);

const sqlAt = (index) => mocks.poolQuery.mock.calls[index][0];
const paramsAt = (index) => mocks.poolQuery.mock.calls[index][1];

describe("POST /users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.poolQuery.mockReset();
    mocks.verifyIdToken.mockReset();
    mocks.verifyIdToken.mockResolvedValue(AUTH_USER);
  });

  it("retorna o usuário existente pelo firebase_uid sem escrever no banco", async () => {
    mocks.poolQuery.mockResolvedValueOnce({ rows: [DB_USER] });

    const res = await syncUser({ name: "Nome Ignorado" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(DB_USER);
    expect(mocks.poolQuery).toHaveBeenCalledTimes(1);
    expect(sqlAt(0)).toBe("SELECT id, name, email, created_at FROM users WHERE firebase_uid = $1");
    expect(paramsAt(0)).toEqual([AUTH_USER.uid]);
  });

  it("cria um usuário novo usando e-mail e UID do token", async () => {
    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [DB_USER] });

    const res = await syncUser();

    expect(res.status).toBe(200);
    expect(res.body).toEqual(DB_USER);
    expect(mocks.poolQuery).toHaveBeenCalledTimes(2);
    expect(sqlAt(1)).toContain("INSERT INTO users");
    expect(sqlAt(1)).toContain("ON CONFLICT DO NOTHING");
    expect(paramsAt(1)).toEqual(["Eduardo", AUTH_USER.email, AUTH_USER.uid]);
  });

  it.each([
    ["nome curto", { name: "Al" }, "Al"],
    ["sem nome", {}, "Sem nome"],
  ])("sincroniza usuário com %s", async (_label, body, expectedName) => {
    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ ...DB_USER, name: expectedName }] });

    const res = await syncUser(body);

    expect(res.status).toBe(200);
    expect(paramsAt(1)).toEqual([expectedName, AUTH_USER.email, AUTH_USER.uid]);
  });

  it("ignora email e uid enviados no body, usando os dados do token", async () => {
    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [DB_USER] });

    const res = await syncUser({
      name: "Eduardo",
      email: "outro@email.com",
      uid: "outro-uid",
    });

    expect(res.status).toBe(200);
    expect(paramsAt(0)).toEqual([AUTH_USER.uid]);
    expect(paramsAt(1)).toEqual(["Eduardo", AUTH_USER.email, AUTH_USER.uid]);
  });

  it("atualiza o e-mail quando ele mudou no Firebase", async () => {
    const updated = { ...DB_USER, email: AUTH_USER.email };

    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [{ ...DB_USER, email: "antigo@email.com" }] })
      .mockResolvedValueOnce({ rows: [updated] });

    const res = await syncUser();

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(sqlAt(1)).toBe("UPDATE users SET email = $2 WHERE id = $1 RETURNING id, name, email, created_at");
    expect(paramsAt(1)).toEqual([DB_USER.id, AUTH_USER.email]);
  });

  it("retorna 409 quando o novo e-mail já pertence a outro usuário", async () => {
    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [{ ...DB_USER, email: "antigo@email.com" }] })
      .mockRejectedValueOnce(Object.assign(new Error("duplicate key"), { code: "23505" }));

    const res = await syncUser();

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "E-mail já vinculado a outra conta" });
  });

  it("retorna o usuário criado por uma requisição concorrente", async () => {
    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [DB_USER] });

    const res = await syncUser();

    expect(res.status).toBe(200);
    expect(res.body).toEqual(DB_USER);
    expect(mocks.poolQuery).toHaveBeenCalledTimes(3);
  });

  it("retorna 409 e não re-vincula quando o e-mail pertence a outro UID e não foi verificado", async () => {
    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await syncUser();

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "E-mail já vinculado a outra conta" });
    expect(mocks.poolQuery).toHaveBeenCalledTimes(3);
    const sqls = mocks.poolQuery.mock.calls.map(([sql]) => sql);
    expect(sqls.some((sql) => sql.includes("SET firebase_uid"))).toBe(false);
  });

  it("re-vincula o registro existente quando o e-mail verificado pertence a outro UID", async () => {
    mocks.verifyIdToken.mockResolvedValue({ ...AUTH_USER, email_verified: true });
    const relinked = { ...DB_USER, id: 9 };

    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [relinked] });

    const res = await syncUser();

    expect(res.status).toBe(200);
    expect(res.body).toEqual(relinked);
    expect(sqlAt(3)).toBe(
      "UPDATE users SET firebase_uid = $2 WHERE email = $1 RETURNING id, name, email, created_at"
    );
    expect(paramsAt(3)).toEqual([AUTH_USER.email, AUTH_USER.uid]);
  });

  it("retorna 401 quando o token é inválido", async () => {
    mocks.verifyIdToken.mockRejectedValueOnce(new Error("Token expirado"));

    const res = await syncUser();

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Token inválido" });
    expect(mocks.poolQuery).not.toHaveBeenCalled();
  });

  it("retorna 500 quando ocorre falha inesperada no banco", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.poolQuery.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await syncUser();

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erro interno do servidor" });
  });
});
