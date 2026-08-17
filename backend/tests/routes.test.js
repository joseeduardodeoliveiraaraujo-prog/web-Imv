import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

vi.mock("../db.js", () => ({
  default: { query: vi.fn() },
}));

vi.mock("../firebaseAdmin.js", () => ({
  default: {
    auth: () => ({
      verifyIdToken: vi.fn().mockResolvedValue({
        uid: "test-uid-123",
        email: "teste@email.com",
      }),
    }),
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: { path: "test" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://test.com/file.jpg" },
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  }),
}));

vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from("test")),
  })),
}));

const pool = (await import("../db.js")).default;

import app from "../server.js";

describe("GET /", () => {
  it("deve retornar status 200", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Backend funcionando");
  });
});

describe("GET /ping", () => {
  it("deve retornar { ok: true }", async () => {
    const res = await request(app).get("/ping");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe("GET /test-db", () => {
  it("deve retornar erro 500 quando o banco falha", async () => {
    pool.query.mockRejectedValueOnce(new Error("Connection refused"));
    const res = await request(app).get("/test-db");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Erro no banco");
  });
});

describe("POST /users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar 400 quando nome tem menos de 3 caracteres", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", "Bearer fake-token")
      .send({ name: "Ed" });

    expect(res.status).toBe(400);
  });

  it("deve retornar 400 quando nome não é fornecido", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", "Bearer fake-token")
      .send({});

    expect(res.status).toBe(400);
  });

  it("deve retornar 401 sem token de autorização", async () => {
    const res = await request(app).post("/users").send({ name: "Eduardo" });
    expect(res.status).toBe(401);
  });
});

describe("GET /certificates/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar 400 para ID não numérico", async () => {
    const res = await request(app)
      .get("/certificates/abc")
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ID inválido");
  });

  it("deve retornar 401 sem token", async () => {
    const res = await request(app).get("/certificates/1");
    expect(res.status).toBe(401);
  });
});

describe("DELETE /certificates/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar 400 para ID não numérico", async () => {
    const res = await request(app)
      .delete("/certificates/abc")
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ID inválido");
  });
});

describe("GET /projects/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar 400 para ID não numérico", async () => {
    const res = await request(app)
      .get("/projects/abc")
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ID inválido");
  });
});

describe("PUT /projects/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar 400 para ID não numérico", async () => {
    const res = await request(app)
      .put("/projects/abc")
      .set("Authorization", "Bearer fake-token")
      .send({});

    expect(res.status).toBe(400);
  });
});

describe("Security headers (Helmet)", () => {
  it("deve retornar headers de segurança", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.headers["content-security-policy"]).toBeDefined();
  });
});

describe("POST /certificates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar 400 quando nome tem menos de 3 caracteres", async () => {
    const res = await request(app)
      .post("/certificates")
      .set("Authorization", "Bearer fake-token")
      .field("name", "AB");

    expect(res.status).toBe(400);
  });

  it("deve retornar 400 quando nenhum arquivo é enviado", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, email: "teste@email.com" }],
    });

    const res = await request(app)
      .post("/certificates")
      .set("Authorization", "Bearer fake-token")
      .field("name", "Certificado Teste");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Arquivo não enviado");
  });
});
