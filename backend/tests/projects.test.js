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

const DB_USER = {
  id: 7,
  name: "Eduardo",
  email: AUTH_USER.email,
  firebase_uid: AUTH_USER.uid,
};

const authHeader = { Authorization: "Bearer fake-token" };

const PROJECT_PAYLOAD = {
  nomesLista: [{ nome: "João", overrides: {} }],
  textoCorpo: "Participou do evento",
  estilos: {
    corNome: "#000000",
    fonteNome: "Inter",
    tamanhoNome: 90,
    corCorpo: "#333333",
    fonteCorpo: "Roboto",
    tamanhoCorpo: 40,
  },
  certificadoId: 5,
  posicoes: {
    nome: { x: 500, y: 300 },
    corpo: { x: 500, y: 500 },
  },
};

const buildProjectRow = (overrides = {}) => ({
  id: 10,
  user_id: DB_USER.id,
  certificate_id: 5,
  nomes_lista: PROJECT_PAYLOAD.nomesLista,
  texto_corpo: PROJECT_PAYLOAD.textoCorpo,
  cor_nome: PROJECT_PAYLOAD.estilos.corNome,
  fonte_nome: PROJECT_PAYLOAD.estilos.fonteNome,
  tamanho_nome: PROJECT_PAYLOAD.estilos.tamanhoNome,
  cor_corpo: PROJECT_PAYLOAD.estilos.corCorpo,
  fonte_corpo: PROJECT_PAYLOAD.estilos.fonteCorpo,
  tamanho_corpo: PROJECT_PAYLOAD.estilos.tamanhoCorpo,
  posicao_nome: PROJECT_PAYLOAD.posicoes.nome,
  posicao_corpo: PROJECT_PAYLOAD.posicoes.corpo,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const expectInsertParams = (params, certificadoId = 5) => {
  expect(params).toEqual([
    DB_USER.id,
    certificadoId,
    JSON.stringify(PROJECT_PAYLOAD.nomesLista),
    PROJECT_PAYLOAD.textoCorpo,
    PROJECT_PAYLOAD.estilos.corNome,
    PROJECT_PAYLOAD.estilos.fonteNome,
    PROJECT_PAYLOAD.estilos.tamanhoNome,
    PROJECT_PAYLOAD.estilos.corCorpo,
    PROJECT_PAYLOAD.estilos.fonteCorpo,
    PROJECT_PAYLOAD.estilos.tamanhoCorpo,
    JSON.stringify(PROJECT_PAYLOAD.posicoes.nome),
    JSON.stringify(PROJECT_PAYLOAD.posicoes.corpo),
  ]);
};

describe("POST /projects - caracterização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.poolQuery.mockReset();
    mocks.verifyIdToken.mockReset();
    mocks.verifyIdToken.mockResolvedValue(AUTH_USER);
  });

  it("cria um projeto e retorna o registro persistido", async () => {
    const project = buildProjectRow();

    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [{ id: DB_USER.id }] })
      .mockResolvedValueOnce({ rows: [project] })
      .mockResolvedValueOnce({ rows: [{ id: project.id }] });

    const res = await request(app)
      .post("/projects")
      .set(authHeader)
      .send(PROJECT_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(project);

    const [userSql, userParams] = mocks.poolQuery.mock.calls[0];
    expect(userSql).toBe("SELECT id FROM users WHERE email = $1");
    expect(userParams).toEqual([AUTH_USER.email]);

    const [insertSql, insertParams] = mocks.poolQuery.mock.calls[1];
    expect(insertSql).toContain("INSERT INTO projects");
    expect(insertSql).toContain("posicao_nome");
    expectInsertParams(insertParams);
  });

  it("mantém no máximo três projetos, removendo os mais antigos", async () => {
    const project = buildProjectRow({ id: 10 });

    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [{ id: DB_USER.id }] })
      .mockResolvedValueOnce({ rows: [project] })
      .mockResolvedValueOnce({
        rows: [{ id: 10 }, { id: 9 }, { id: 8 }, { id: 7 }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/projects")
      .set(authHeader)
      .send(PROJECT_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(project);
    expect(mocks.poolQuery).toHaveBeenCalledTimes(4);

    const [deleteSql, deleteParams] = mocks.poolQuery.mock.calls[3];
    expect(deleteSql).toContain("DELETE FROM projects");
    expect(deleteSql).toContain("WHERE id = ANY($1::int[])");
    expect(deleteParams).toEqual([[7]]);
  });

  it("não executa exclusão quando o usuário tem exatamente três projetos", async () => {
    const project = buildProjectRow({ id: 10 });

    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [{ id: DB_USER.id }] })
      .mockResolvedValueOnce({ rows: [project] })
      .mockResolvedValueOnce({
        rows: [{ id: 10 }, { id: 9 }, { id: 8 }],
      });

    const res = await request(app)
      .post("/projects")
      .set(authHeader)
      .send(PROJECT_PAYLOAD);

    expect(res.status).toBe(200);
    expect(mocks.poolQuery).toHaveBeenCalledTimes(3);
    expect(mocks.poolQuery.mock.calls[2][0]).not.toContain("DELETE");
  });

  it("retorna 404 quando o usuário autenticado não existe no banco", async () => {
    mocks.poolQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/projects")
      .set(authHeader)
      .send(PROJECT_PAYLOAD);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Usuário não encontrado" });
    expect(mocks.poolQuery).toHaveBeenCalledTimes(1);
  });

  it("retorna 400 quando o payload do projeto é inválido", async () => {
    const res = await request(app)
      .post("/projects")
      .set(authHeader)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(mocks.poolQuery).not.toHaveBeenCalled();
  });

  it("retorna 500 quando o insert do projeto falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [{ id: DB_USER.id }] })
      .mockRejectedValueOnce(new Error("db indisponível"));

    const res = await request(app)
      .post("/projects")
      .set(authHeader)
      .send(PROJECT_PAYLOAD);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erro ao salvar projeto" });
  });

  it("caracteriza projeto criado mesmo quando a limpeza dos antigos falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const project = buildProjectRow({ id: 10 });

    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [{ id: DB_USER.id }] })
      .mockResolvedValueOnce({ rows: [project] })
      .mockResolvedValueOnce({
        rows: [{ id: 10 }, { id: 9 }, { id: 8 }, { id: 7 }],
      })
      .mockRejectedValueOnce(new Error("db indisponível"));

    const res = await request(app)
      .post("/projects")
      .set(authHeader)
      .send(PROJECT_PAYLOAD);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erro ao salvar projeto" });
    expect(mocks.poolQuery).toHaveBeenCalledTimes(4);
    expect(mocks.poolQuery.mock.calls[1][0]).toContain("INSERT INTO projects");
  });

  it("caracteriza falta de validação da propriedade do certificado", async () => {
    const project = buildProjectRow({ certificate_id: 999 });

    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [{ id: DB_USER.id }] })
      .mockResolvedValueOnce({ rows: [project] })
      .mockResolvedValueOnce({ rows: [{ id: project.id }] });

    const res = await request(app)
      .post("/projects")
      .set(authHeader)
      .send({ ...PROJECT_PAYLOAD, certificadoId: 999 });

    expect(res.status).toBe(200);

    const sqls = mocks.poolQuery.mock.calls.map(([sql]) => sql);
    expect(sqls.some((sql) => /FROM certificates/i.test(sql))).toBe(false);
    expectInsertParams(mocks.poolQuery.mock.calls[1][1], 999);
  });
});

describe("GET /projects - caracterização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.poolQuery.mockReset();
    mocks.verifyIdToken.mockReset();
    mocks.verifyIdToken.mockResolvedValue(AUTH_USER);
  });

  it("lista até três projetos recentes com dados do certificado", async () => {
    const projects = [
      buildProjectRow({ id: 10, title: "Certificado A", thumbnail_path: "a" }),
      buildProjectRow({ id: 9, title: "Certificado B", thumbnail_path: "b" }),
    ];

    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [DB_USER] })
      .mockResolvedValueOnce({ rows: projects });

    const res = await request(app).get("/projects").set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(projects);

    const [sql, params] = mocks.poolQuery.mock.calls[1];
    expect(sql).toContain("FROM projects p");
    expect(sql).toContain("JOIN certificates c");
    expect(sql).toContain("ORDER BY p.updated_at DESC");
    expect(sql).toContain("LIMIT 3");
    expect(params).toEqual([DB_USER.id]);
  });

  it("retorna 404 quando o usuário autenticado não existe no banco", async () => {
    mocks.poolQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/projects").set(authHeader);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Usuário não encontrado" });
  });

  it("retorna 500 quando a listagem falha no banco", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.poolQuery.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await request(app).get("/projects").set(authHeader);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erro ao buscar projetos" });
  });
});

describe("GET /projects/:id - caracterização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.poolQuery.mockReset();
    mocks.verifyIdToken.mockReset();
    mocks.verifyIdToken.mockResolvedValue(AUTH_USER);
  });

  it("retorna o projeto do usuário com dados do certificado", async () => {
    const project = buildProjectRow({
      title: "Certificado A",
      image_path: "https://cdn/original.png",
      thumbnail_path: "https://cdn/thumb.webp",
    });

    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [DB_USER] })
      .mockResolvedValueOnce({ rows: [project] });

    const res = await request(app).get("/projects/10").set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(project);

    const [sql, params] = mocks.poolQuery.mock.calls[1];
    expect(sql).toContain("FROM projects p");
    expect(sql).toContain("JOIN certificates c");
    expect(sql).toContain("AND p.user_id = $2");
    expect(params).toEqual([10, DB_USER.id]);
  });

  it("retorna 404 quando o projeto não pertence ao usuário ou não existe", async () => {
    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [DB_USER] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/projects/999").set(authHeader);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Projeto não encontrado" });
  });
});

describe("PUT /projects/:id - caracterização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.poolQuery.mockReset();
    mocks.verifyIdToken.mockReset();
    mocks.verifyIdToken.mockResolvedValue(AUTH_USER);
  });

  it("atualiza os dados do projeto e retorna o registro atualizado", async () => {
    const updatedProject = buildProjectRow({
      id: 10,
      updated_at: "2026-01-02T00:00:00.000Z",
    });

    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [{ id: DB_USER.id }] })
      .mockResolvedValueOnce({ rows: [updatedProject] });

    const res = await request(app)
      .put("/projects/10")
      .set(authHeader)
      .send(PROJECT_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedProject);

    const [updateSql, updateParams] = mocks.poolQuery.mock.calls[1];
    expect(updateSql).toContain("UPDATE projects");
    expect(updateSql).toContain("updated_at = NOW()");
    expect(updateSql).toContain("WHERE id = $11 AND user_id = $12");
    expect(updateParams).toEqual([
      JSON.stringify(PROJECT_PAYLOAD.nomesLista),
      PROJECT_PAYLOAD.textoCorpo,
      PROJECT_PAYLOAD.estilos.corNome,
      PROJECT_PAYLOAD.estilos.fonteNome,
      PROJECT_PAYLOAD.estilos.tamanhoNome,
      PROJECT_PAYLOAD.estilos.corCorpo,
      PROJECT_PAYLOAD.estilos.fonteCorpo,
      PROJECT_PAYLOAD.estilos.tamanhoCorpo,
      JSON.stringify(PROJECT_PAYLOAD.posicoes.nome),
      JSON.stringify(PROJECT_PAYLOAD.posicoes.corpo),
      10,
      DB_USER.id,
    ]);
  });

  it("retorna 400 quando o payload de atualização é inválido", async () => {
    const res = await request(app)
      .put("/projects/10")
      .set(authHeader)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(mocks.poolQuery).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o usuário autenticado não existe no banco", async () => {
    mocks.poolQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put("/projects/10")
      .set(authHeader)
      .send(PROJECT_PAYLOAD);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Usuário não encontrado" });
  });

  it("retorna 404 quando o projeto não pertence ao usuário ou não existe", async () => {
    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [{ id: DB_USER.id }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put("/projects/999")
      .set(authHeader)
      .send(PROJECT_PAYLOAD);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: "Projeto não encontrado ou sem permissão",
    });
  });

  it("retorna 500 quando a atualização falha no banco", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [{ id: DB_USER.id }] })
      .mockRejectedValueOnce(new Error("db indisponível"));

    const res = await request(app)
      .put("/projects/10")
      .set(authHeader)
      .send(PROJECT_PAYLOAD);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erro ao atualizar projeto" });
  });
});
