import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";

vi.hoisted(() => {
  process.env.FRONTEND_URL =
    "https://allowed.example,https://second.example";
});

import pool from "../db.js";
import app from "../server.js";

const ALLOWED_ORIGIN = "https://allowed.example";
const SECOND_ALLOWED_ORIGIN = "https://second.example";

describe("CORS - caracterização", () => {
  it("permite origem configurada em FRONTEND_URL", async () => {
    const res = await request(app)
      .get("/")
      .set("Origin", ALLOWED_ORIGIN);

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("permite a segunda origem da lista separada por vírgula", async () => {
    const res = await request(app)
      .get("/")
      .set("Origin", SECOND_ALLOWED_ORIGIN);

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(
      SECOND_ALLOWED_ORIGIN
    );
  });

  it("permite requisições sem cabeçalho Origin", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
  });

  it("retorna 403 para origem não configurada", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app)
      .get("/")
      .set("Origin", "https://evil.example");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Acesso negado" });
  });
});

describe("Payloads - caracterização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retorna 413 para payload JSON acima de 1MB", async () => {
    const res = await request(app)
      .post("/users")
      .send({ name: "x".repeat(1024 * 1024 + 10) });

    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: "Payload excede o tamanho máximo" });
  });

  it("caracteriza JSON malformado como erro 500", async () => {
    const res = await request(app)
      .post("/users")
      .set("Content-Type", "application/json")
      .send('{"name":');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erro interno do servidor" });
  });
});

describe("Health checks - caracterização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /test-db é público e retorna o resultado da query", async () => {
    const databaseRow = { now: "2026-01-01T00:00:00.000Z" };
    pool.query.mockResolvedValueOnce({ rows: [databaseRow] });

    const res = await request(app).get("/test-db");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([databaseRow]);
    expect(pool.query).toHaveBeenCalledWith("SELECT NOW()");
  });
});
