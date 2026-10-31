import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const mocks = vi.hoisted(() => {
  const poolQuery = vi.fn();
  const verifyIdToken = vi.fn();
  const upload = vi.fn();
  const getPublicUrl = vi.fn();
  const remove = vi.fn();
  const from = vi.fn();
  const createClient = vi.fn();
  const sharpInstance = {
    resize: vi.fn(),
    webp: vi.fn(),
    toBuffer: vi.fn(),
  };

  sharpInstance.resize.mockReturnValue(sharpInstance);
  sharpInstance.webp.mockReturnValue(sharpInstance);

  const sharp = vi.fn(() => sharpInstance);

  createClient.mockReturnValue({ storage: { from } });
  from.mockReturnValue({ upload, getPublicUrl, remove });

  return {
    poolQuery,
    verifyIdToken,
    upload,
    getPublicUrl,
    remove,
    from,
    createClient,
    sharp,
    sharpInstance,
  };
});

vi.mock("../db.js", () => ({
  default: { query: mocks.poolQuery },
}));

vi.mock("../firebaseAdmin.js", () => ({
  default: {
    auth: () => ({ verifyIdToken: mocks.verifyIdToken }),
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

vi.mock("sharp", () => ({
  default: mocks.sharp,
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
const bucket = "certificates";

const attachImage = (req, buffer = Buffer.from("imagem-fake")) =>
  req.attach("file", buffer, {
    filename: "modelo teste.png",
    contentType: "image/png",
  });

describe("GET /certificates - caracterização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.poolQuery.mockReset();
    mocks.verifyIdToken.mockReset();
    mocks.verifyIdToken.mockResolvedValue(AUTH_USER);
  });

  it("lista certificados do usuário autenticado em ordem decrescente de id", async () => {
    const certificates = [
      { id: 2, title: "Certificado B" },
      { id: 1, title: "Certificado A" },
    ];

    mocks.poolQuery.mockResolvedValueOnce({ rows: certificates });

    const res = await request(app).get("/certificates").set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(certificates);

    const [certSql, certParams] = mocks.poolQuery.mock.calls[0];
    expect(certSql).toContain("FROM users u");
    expect(certSql).toContain("LEFT JOIN certificates c");
    expect(certSql).toContain("ORDER BY c.id DESC");
    expect(certParams).toEqual([AUTH_USER.email]);
    expect(mocks.poolQuery).toHaveBeenCalledTimes(1);
  });

  it("retorna lista vazia quando o usuário existe mas não tem certificados", async () => {
    mocks.poolQuery.mockResolvedValueOnce({ rows: [{ id: null }] });

    const res = await request(app).get("/certificates").set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("retorna 404 quando o usuário autenticado não existe no banco", async () => {
    mocks.poolQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/certificates").set(authHeader);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Usuário não encontrado" });
    expect(mocks.poolQuery).toHaveBeenCalledTimes(1);
  });

  it("retorna 500 quando a listagem falha no banco", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.poolQuery.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await request(app).get("/certificates").set(authHeader);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erro ao buscar certificados" });
  });
});

describe("GET /certificates/:id - caracterização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.poolQuery.mockReset();
    mocks.verifyIdToken.mockReset();
    mocks.verifyIdToken.mockResolvedValue(AUTH_USER);
  });

  it("retorna o certificado do usuário autenticado", async () => {
    const certificate = {
      id: 12,
      title: "Certificado",
      image_path: "https://cdn/original.png",
      thumbnail_path: "https://cdn/thumb.webp",
      user_id: DB_USER.id,
    };

    mocks.poolQuery.mockResolvedValueOnce({ rows: [certificate] });

    const res = await request(app).get("/certificates/12").set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(certificate);

    const [certSql, certParams] = mocks.poolQuery.mock.calls[0];
    expect(certSql).toContain("FROM users u");
    expect(certSql).toContain("LEFT JOIN certificates c");
    expect(certSql).toContain("c.id = $2");
    expect(certParams).toEqual([AUTH_USER.email, 12]);
    expect(mocks.poolQuery).toHaveBeenCalledTimes(1);
  });

  it("retorna 404 quando o certificado não pertence ao usuário ou não existe", async () => {
    mocks.poolQuery.mockResolvedValueOnce({ rows: [{ id: null }] });

    const res = await request(app).get("/certificates/999").set(authHeader);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Certificado não encontrado" });
  });
});

describe("POST /certificates - caracterização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.poolQuery.mockReset();
    mocks.verifyIdToken.mockReset();
    mocks.upload.mockReset();
    mocks.getPublicUrl.mockReset();
    mocks.remove.mockReset();
    mocks.sharpInstance.toBuffer.mockReset();

    mocks.verifyIdToken.mockResolvedValue(AUTH_USER);
    mocks.upload.mockResolvedValue({ data: { path: "ok" }, error: null });
    mocks.getPublicUrl.mockReturnValue({
      data: { publicUrl: "https://test.com/file.jpg" },
    });
    mocks.remove.mockResolvedValue({ error: null });
    mocks.sharpInstance.toBuffer.mockResolvedValue(Buffer.from("thumb"));
  });

  it("faz upload do original, gera thumbnail e salva o certificado", async () => {
    const createdCertificate = {
      id: 10,
      title: "Certificado Teste",
      image_path: "https://cdn/original.png",
      thumbnail_path: "https://cdn/thumb.webp",
      user_id: DB_USER.id,
    };

    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [DB_USER] })
      .mockResolvedValueOnce({ rows: [createdCertificate] });

    mocks.getPublicUrl
      .mockReturnValueOnce({ data: { publicUrl: "https://cdn/original.png" } })
      .mockReturnValueOnce({ data: { publicUrl: "https://cdn/thumb.webp" } });

    const res = await attachImage(
      request(app)
        .post("/certificates")
        .set(authHeader)
        .field("name", "Certificado Teste")
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(createdCertificate);

    expect(mocks.from).toHaveBeenCalledWith(bucket);
    expect(mocks.sharp).toHaveBeenCalledWith(Buffer.from("imagem-fake"));
    expect(mocks.sharpInstance.resize).toHaveBeenCalledWith({ width: 300 });
    expect(mocks.sharpInstance.webp).toHaveBeenCalledWith({ quality: 70 });
    expect(mocks.sharpInstance.toBuffer).toHaveBeenCalled();

    expect(mocks.upload).toHaveBeenCalledTimes(2);

    const [originalName, originalBuffer, originalOptions] =
      mocks.upload.mock.calls[0];
    expect(originalName).toMatch(/^\d+_modelo_teste\.png$/);
    expect(originalBuffer).toEqual(Buffer.from("imagem-fake"));
    expect(originalOptions).toEqual({
      cacheControl: "31536000",
      contentType: "image/png",
    });

    const [thumbName, thumbBuffer, thumbOptions] = mocks.upload.mock.calls[1];
    expect(thumbName).toBe(`thumb_${originalName}`);
    expect(thumbBuffer).toEqual(Buffer.from("thumb"));
    expect(thumbOptions).toEqual({
      cacheControl: "31536000",
      contentType: "image/webp",
    });

    const [insertSql, insertParams] = mocks.poolQuery.mock.calls[1];
    expect(insertSql).toBe(
      "INSERT INTO certificates (title, image_path, thumbnail_path, user_id) VALUES ($1, $2, $3, $4) RETURNING *"
    );
    expect(insertParams).toEqual([
      "Certificado Teste",
      "https://cdn/original.png",
      "https://cdn/thumb.webp",
      DB_USER.id,
    ]);
  });

  it("retorna 404 quando o usuário autenticado não existe no banco", async () => {
    mocks.poolQuery.mockResolvedValueOnce({ rows: [] });

    const res = await attachImage(
      request(app)
        .post("/certificates")
        .set(authHeader)
        .field("name", "Certificado Teste")
    );

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Usuário não encontrado" });
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("remove os arquivos enviados quando o Storage retorna erro", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.poolQuery.mockResolvedValueOnce({ rows: [DB_USER] });
    mocks.upload.mockResolvedValueOnce({
      data: null,
      error: { message: "storage indisponível" },
    });

    const res = await attachImage(
      request(app)
        .post("/certificates")
        .set(authHeader)
        .field("name", "Certificado Teste")
    );

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erro ao fazer upload do arquivo" });
    expect(mocks.poolQuery).toHaveBeenCalledTimes(1);

    const fileName = mocks.upload.mock.calls[0][0];
    expect(mocks.remove).toHaveBeenCalledWith([
      fileName,
      `thumb_${fileName}`,
    ]);
  });

  it("remove os arquivos enviados quando o insert no banco falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [DB_USER] })
      .mockRejectedValueOnce(new Error("db indisponível"));

    const res = await attachImage(
      request(app)
        .post("/certificates")
        .set(authHeader)
        .field("name", "Certificado Teste")
    );

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erro ao salvar certificado" });

    const fileName = mocks.upload.mock.calls[0][0];
    expect(mocks.remove).toHaveBeenCalledWith([
      fileName,
      `thumb_${fileName}`,
    ]);
  });

  it("caracteriza ausência de rollback quando as URLs públicas não são retornadas", async () => {
    mocks.poolQuery.mockResolvedValueOnce({ rows: [DB_USER] });
    mocks.getPublicUrl.mockReturnValue({ data: {} });

    const res = await attachImage(
      request(app)
        .post("/certificates")
        .set(authHeader)
        .field("name", "Certificado Teste")
    );

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erro ao obter URLs do arquivo" });
    expect(mocks.upload).toHaveBeenCalledTimes(2);
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("retorna 500 quando a geração da thumbnail falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.poolQuery.mockResolvedValueOnce({ rows: [DB_USER] });
    mocks.sharpInstance.toBuffer.mockRejectedValueOnce(
      new Error("sharp indisponível")
    );

    const res = await attachImage(
      request(app)
        .post("/certificates")
        .set(authHeader)
        .field("name", "Certificado Teste")
    );

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erro ao salvar certificado" });
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("retorna 400 para arquivo com MIME não permitido", async () => {
    const res = await request(app)
      .post("/certificates")
      .set(authHeader)
      .field("name", "Certificado Teste")
      .attach("file", Buffer.from("texto"), {
        filename: "modelo.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Apenas imagens são permitidas" });
    expect(mocks.poolQuery).not.toHaveBeenCalled();
  });

  it("retorna 413 para arquivo acima de 5MB", async () => {
    const oversizedImage = Buffer.alloc(5 * 1024 * 1024 + 1);

    const res = await request(app)
      .post("/certificates")
      .set(authHeader)
      .field("name", "Certificado Teste")
      .attach("file", oversizedImage, {
        filename: "grande.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(413);
    expect(res.body).toEqual({
      error: "Arquivo excede o tamanho máximo de 5MB",
    });
    expect(mocks.poolQuery).not.toHaveBeenCalled();
  });
});

describe("DELETE /certificates/:id - caracterização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.poolQuery.mockReset();
    mocks.verifyIdToken.mockReset();
    mocks.remove.mockReset();
    mocks.verifyIdToken.mockResolvedValue(AUTH_USER);
    mocks.remove.mockResolvedValue({ error: null });
  });

  const certificate = {
    id: 12,
    title: "Certificado",
    image_path:
      "https://xyz.supabase.co/storage/v1/object/public/certificates/123_modelo.png",
    thumbnail_path:
      "https://xyz.supabase.co/storage/v1/object/public/certificates/thumb_123_modelo.png",
    user_id: DB_USER.id,
  };

  it("remove original e thumbnail do Storage e depois o registro do banco", async () => {
    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [certificate] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete("/certificates/12")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Deletado com sucesso" });

    expect(mocks.remove).toHaveBeenCalledWith([
      "123_modelo.png",
      "thumb_123_modelo.png",
    ]);

    const [deleteSql, deleteParams] = mocks.poolQuery.mock.calls[1];
    expect(deleteSql).toBe(
      "DELETE FROM certificates WHERE id = $1 AND user_id = $2"
    );
    expect(deleteParams).toEqual([12, DB_USER.id]);
    expect(mocks.poolQuery).toHaveBeenCalledTimes(2);
  });

  it("retorna 404 quando o certificado não pertence ao usuário ou não existe", async () => {
    mocks.poolQuery.mockResolvedValueOnce({ rows: [{ id: null }] });

    const res = await request(app)
      .delete("/certificates/999")
      .set(authHeader);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Certificado não encontrado" });
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("caracteriza exclusão do banco mesmo com erro no Storage", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [certificate] })
      .mockResolvedValueOnce({ rows: [] });
    mocks.remove.mockResolvedValueOnce({
      error: { message: "storage indisponível" },
    });

    const res = await request(app)
      .delete("/certificates/12")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Deletado com sucesso" });
    expect(mocks.poolQuery).toHaveBeenCalledTimes(2);
  });

  it("caracteriza remoção do Storage antes de falhar no delete do banco", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.poolQuery
      .mockResolvedValueOnce({ rows: [certificate] })
      .mockRejectedValueOnce(new Error("db indisponível"));

    const res = await request(app)
      .delete("/certificates/12")
      .set(authHeader);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erro ao deletar" });
    expect(mocks.remove).toHaveBeenCalledWith([
      "123_modelo.png",
      "thumb_123_modelo.png",
    ]);
  });
});
