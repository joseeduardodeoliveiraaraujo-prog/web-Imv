import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import request from "supertest";

/**
 * Testes de integração contra um PostgreSQL real.
 * Rodam apenas com TEST_DATABASE_URL definida e usam o schema isolado
 * "imv_integration", recriado a cada execução a partir das migrations.
 * Firebase, Supabase Storage e Sharp continuam mockados (tests/setup.js).
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const SCHEMA = "imv_integration";

const mocks = vi.hoisted(() => ({ realPool: null }));

vi.mock("../../db.js", () => ({
  default: { query: (...args) => mocks.realPool.query(...args) },
}));

vi.mock("../../firebaseAdmin.js", () => ({
  default: {
    auth: () => ({
      verifyIdToken: async (token) => ({
        uid: token,
        email: `${token}@teste.com`,
        email_verified: true,
      }),
    }),
  },
}));

const { default: app } = await import("../../server.js");

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../database"
);

const as = (uid) => ({ Authorization: `Bearer ${uid}` });

const projectPayload = (certificadoId) => ({
  nomesLista: [{ nome: "João", overrides: { textoCorpo: "Texto próprio" } }],
  textoCorpo: "Participou do evento",
  estilos: {
    corNome: "#000000",
    fonteNome: "Inter",
    tamanhoNome: 45.6,
    corCorpo: "#333333",
    fonteCorpo: "Lora",
    tamanhoCorpo: 40,
  },
  certificadoId,
  posicoes: { nome: { x: 500.5, y: 300 }, corpo: { x: 500, y: 520 } },
});

const uploadCertificate = (uid, name) =>
  request(app)
    .post("/certificates")
    .set(as(uid))
    .field("name", name)
    .attach("file", Buffer.from("imagem"), {
      filename: "modelo.png",
      contentType: "image/png",
    });

describe.skipIf(!TEST_DATABASE_URL)("Integração com PostgreSQL", () => {
  let certA;
  let certB;
  let projectId;

  beforeAll(async () => {
    if (TEST_DATABASE_URL === process.env.DATABASE_URL) {
      throw new Error("TEST_DATABASE_URL não pode ser igual a DATABASE_URL");
    }

    const admin = new pg.Pool({ connectionString: TEST_DATABASE_URL });
    await admin.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await admin.query(`CREATE SCHEMA ${SCHEMA}`);
    await admin.end();

    mocks.realPool = new pg.Pool({
      connectionString: TEST_DATABASE_URL,
      options: `-c search_path=${SCHEMA}`,
    });

    const migrations = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of migrations) {
      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      await mocks.realPool.query(sql);
    }
  });

  afterAll(async () => {
    await mocks.realPool?.end();
  });

  it("as migrations criam todas as colunas usadas pelo backend", async () => {
    const { rows } = await mocks.realPool.query(
      `SELECT table_name, column_name
         FROM information_schema.columns
        WHERE table_schema = $1`,
      [SCHEMA]
    );
    const columns = rows.map((row) => `${row.table_name}.${row.column_name}`);

    expect(columns).toEqual(
      expect.arrayContaining([
        "certificates.thumbnail_path",
        "projects.posicao_nome",
        "projects.posicao_corpo",
      ])
    );
  });

  it("sincroniza usuários e é idempotente", async () => {
    const first = await request(app).post("/users").set(as("ana")).send({ name: "Ana" });
    const again = await request(app).post("/users").set(as("ana")).send({ name: "Ana" });
    const bia = await request(app).post("/users").set(as("bia")).send({ name: "Bi" });

    expect(first.status).toBe(200);
    expect(again.body).toEqual(first.body);
    expect(bia.status).toBe(200);
    expect(first.body).not.toHaveProperty("firebase_uid");
  });

  it("salva certificados e lista apenas os do próprio usuário", async () => {
    const resA = await uploadCertificate("ana", "Modelo da Ana");
    const resB = await uploadCertificate("bia", "Modelo da Bia");
    certA = resA.body;
    certB = resB.body;

    expect(resA.status).toBe(200);
    expect(certA).not.toHaveProperty("user_id");

    const list = await request(app).get("/certificates").set(as("ana"));
    expect(list.body.map((cert) => cert.id)).toEqual([certA.id]);

    const foreign = await request(app).get(`/certificates/${certB.id}`).set(as("ana"));
    expect(foreign.status).toBe(404);
  });

  it("cria projeto com certificado próprio e arredonda tamanho decimal", async () => {
    const res = await request(app)
      .post("/projects")
      .set(as("ana"))
      .send(projectPayload(certA.id));

    projectId = res.body.id;
    expect(res.status).toBe(200);
    expect(res.body.tamanho_nome).toBe(46);
    expect(res.body.posicao_nome).toEqual({ x: 500.5, y: 300 });
    expect(res.body).not.toHaveProperty("user_id");
  });

  it("bloqueia projeto com certificado de outro usuário", async () => {
    const res = await request(app)
      .post("/projects")
      .set(as("ana"))
      .send(projectPayload(certB.id));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Certificado não encontrado" });
  });

  it("mantém apenas os 5 projetos mais recentes e lista colunas enxutas", async () => {
    for (let i = 0; i < 6; i += 1) {
      await request(app).post("/projects").set(as("ana")).send(projectPayload(certA.id));
    }

    const list = await request(app).get("/projects").set(as("ana"));

    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(5);
    expect(Object.keys(list.body[0]).sort()).toEqual(
      ["certificate_id", "created_at", "id", "thumbnail_path", "title", "updated_at"]
    );
  });

  it("restringe leitura e atualização de projetos ao dono", async () => {
    const { rows } = await mocks.realPool.query(
      "SELECT id FROM projects ORDER BY id DESC LIMIT 1"
    );
    const latestId = rows[0].id;

    const asOwner = await request(app).get(`/projects/${latestId}`).set(as("ana"));
    const asOther = await request(app).get(`/projects/${latestId}`).set(as("bia"));
    const updateAsOther = await request(app)
      .put(`/projects/${latestId}`)
      .set(as("bia"))
      .send(projectPayload(certA.id));

    expect(asOwner.status).toBe(200);
    expect(asOwner.body.image_path).toBe(certA.image_path);
    expect(asOther.status).toBe(404);
    expect(updateAsOther.status).toBe(404);
    expect(projectId).toBeDefined();
  });

  it("exclui o certificado e remove os projetos em cascata", async () => {
    const res = await request(app).delete(`/certificates/${certA.id}`).set(as("ana"));
    const projects = await request(app).get("/projects").set(as("ana"));

    expect(res.status).toBe(200);
    expect(projects.body).toEqual([]);
  });
});
