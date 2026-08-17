import express from "express";
import cors from "cors";
import helmet from "helmet";
import pool from "./db.js";
import authMiddleware from "./middleware/auth.js";
import multer from "multer";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { generalLimiter, uploadLimiter } from "./middleware/rateLimiter.js";
import {
  validate,
  createUserSchema,
  createCertificateSchema,
  idParamSchema,
  createProjectSchema,
  updateProjectSchema,
} from "./middleware/validate.js";

// Inicialização da instância principal da API Express
const app = express();

// Instanciação do client do Supabase para transações no Storage Bucket
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ==========================================================================
// MIDDLEWARES GLOBAIS DE SEGURANÇA
// ==========================================================================

app.use(helmet());

app.use(generalLimiter);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origem não permitida pelo CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// ==========================================================================
// TRATAMENTO CENTRALIZADO DE ERROS
// ==========================================================================

function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  if (err.message === "Origem não permitida pelo CORS") {
    return res.status(403).json({ error: "Acesso negado" });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload excede o tamanho máximo" });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(413)
      .json({ error: "Arquivo excede o tamanho máximo de 5MB" });
  }

  if (err.message === "Apenas imagens são permitidas") {
    return res.status(400).json({ error: "Apenas imagens são permitidas" });
  }

  res.status(500).json({ error: "Erro interno do servidor" });
}

// ==========================================================================
// ROTAS DE VERIFICAÇÃO / HEALTH CHECK
// ==========================================================================

app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (error) {
    console.error("[ERROR] /test-db:", error.message);
    res.status(500).json({ error: "Erro no banco" });
  }
});

// ==========================================================================
// ROTAS DE GERENCIAMENTO DE USUÁRIOS
// ==========================================================================

app.post("/users", authMiddleware, async (req, res) => {
  try {
    const validation = validate(createUserSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.errors.join(", ") });
    }

    const { name } = validation.data;
    const email = req.user.email;
    const uid = req.user.uid;

    const result = await pool.query(
      `INSERT INTO users (name, email, firebase_uid)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid) DO NOTHING
       RETURNING *`,
      [name, email, uid]
    );

    if (result.rows.length === 0) {
      const existingUser = await pool.query(
        "SELECT * FROM users WHERE firebase_uid = $1",
        [uid]
      );
      return res.json(existingUser.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("[ERROR] POST /users:", error.message);
    res.status(500).json({ error: "Erro ao salvar usuário" });
  }
});

// ==========================================================================
// CONFIGURAÇÃO DO MULTER (MIDDLEWARE DE ARQUIVOS)
// ==========================================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas"));
    }
  },
});

// ==========================================================================
// ROTAS DE MODELOS DE CERTIFICADOS
// ==========================================================================

app.post(
  "/certificates",
  authMiddleware,
  uploadLimiter,
  upload.single("file"),
  async (req, res) => {
    try {
      const validation = validate(createCertificateSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.errors.join(", ") });
      }

      const { name } = validation.data;

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "Arquivo não enviado" });
      }

      const email = req.user.email;

      const userResult = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      const user = userResult.rows[0];

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const safeName = file.originalname
        .replace(/\s+/g, "_")
        .replace(/[^\w.-]/g, "");

      const fileName = `${Date.now()}_${safeName}`;
      const thumbname = `thumb_${fileName}`;

      const thumbnailBuffer = await sharp(file.buffer)
        .resize({ width: 300 })
        .webp({ quality: 70 })
        .toBuffer();

      const [originalUpload, thumbUpload] = await Promise.all([
        supabase.storage.from("certificates").upload(fileName, file.buffer, {
          cacheControl: "31536000",
          contentType: file.mimetype,
        }),
        supabase.storage.from("certificates").upload(thumbname, thumbnailBuffer, {
          cacheControl: "31536000",
          contentType: "image/webp",
        }),
      ]);

      if (originalUpload.error || thumbUpload.error) {
        console.error(
          "Erro no upload:",
          originalUpload.error || thumbUpload.error
        );

        await supabase.storage
          .from("certificates")
          .remove([fileName, thumbname]);

        return res.status(500).json({ error: "Erro ao fazer upload do arquivo" });
      }

      const { data: imageData } = supabase.storage
        .from("certificates")
        .getPublicUrl(fileName);

      const { data: thumbData } = supabase.storage
        .from("certificates")
        .getPublicUrl(thumbname);

      if (!imageData?.publicUrl || !thumbData?.publicUrl) {
        return res.status(500).json({ error: "Erro ao obter URLs do arquivo" });
      }

      try {
        const result = await pool.query(
          "INSERT INTO certificates (title, image_path, thumbnail_path, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
          [name, imageData.publicUrl, thumbData.publicUrl, user.id]
        );

        res.json(result.rows[0]);
      } catch (dbError) {
        console.error("[ERROR] POST /certificates DB:", dbError.message);

        await supabase.storage
          .from("certificates")
          .remove([fileName, thumbname]);

        return res.status(500).json({ error: "Erro ao salvar certificado" });
      }
    } catch (error) {
      console.error("[ERROR] POST /certificates:", error.message);
      res.status(500).json({ error: "Erro ao salvar certificado" });
    }
  }
);

app.get("/certificates", authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const certResult = await pool.query(
      "SELECT * FROM certificates WHERE user_id = $1 ORDER BY id DESC",
      [user.id]
    );

    res.json(certResult.rows);
  } catch (error) {
    console.error("[ERROR] GET /certificates:", error.message);
    res.status(500).json({ error: "Erro ao buscar certificados" });
  }
});

// ==========================================================================
// ROTAS DE CONSULTA DE MODELOS ESPECÍFICOS
// ==========================================================================

app.get("/certificates/:id", authMiddleware, async (req, res) => {
  try {
    const paramValidation = validate(idParamSchema, { id: req.params.id });
    if (!paramValidation.success) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { id } = paramValidation.data;
    const email = req.user.email;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const certResult = await pool.query(
      "SELECT * FROM certificates WHERE id = $1 AND user_id = $2",
      [id, user.id]
    );

    if (certResult.rows.length === 0) {
      return res.status(404).json({ error: "Certificado não encontrado" });
    }

    res.json(certResult.rows[0]);
  } catch (error) {
    console.error("[ERROR] GET /certificates/:id:", error.message);
    res.status(500).json({ error: "Erro ao buscar certificado" });
  }
});

// ==========================================================================
// ROTAS DE GERENCIAMENTO DE PROJETOS (WORKSPACES DE EDIÇÃO)
// ==========================================================================

app.post("/projects", authMiddleware, async (req, res) => {
  try {
    const validation = validate(createProjectSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.errors.join(", ") });
    }

    const { nomesLista, textoCorpo, estilos, certificadoId, posicoes } =
      validation.data;
    const email = req.user.email;

    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];

    if (!user)
      return res.status(404).json({ error: "Usuário não encontrado" });

    const result = await pool.query(
      `INSERT INTO projects (
        user_id, certificate_id, nomes_lista, texto_corpo,
        cor_nome, fonte_nome, tamanho_nome,
        cor_corpo, fonte_corpo, tamanho_corpo,
        posicao_nome, posicao_corpo
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        user.id,
        certificadoId,
        JSON.stringify(nomesLista),
        textoCorpo,
        estilos.corNome,
        estilos.fonteNome,
        estilos.tamanhoNome,
        estilos.corCorpo,
        estilos.fonteCorpo,
        estilos.tamanhoCorpo,
        JSON.stringify(posicoes.nome),
        JSON.stringify(posicoes.corpo),
      ]
    );

    const projectsResult = await pool.query(
      `
      SELECT id
      FROM projects
      WHERE user_id = $1
      ORDER BY updated_at DESC
      `,
      [user.id]
    );

    const projects = projectsResult.rows;

    if (projects.length > 3) {
      const idsParaRemover = projects.slice(3).map((project) => project.id);

      await pool.query(
        `
        DELETE FROM projects
        WHERE id = ANY($1::int[])
        `,
        [idsParaRemover]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("[ERROR] POST /projects:", error.message);
    res.status(500).json({ error: "Erro ao salvar projeto" });
  }
});

app.get("/projects", authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const projectsResult = await pool.query(
      `
      SELECT
        p.*,
        c.title,
        c.thumbnail_path
      FROM projects p
      JOIN certificates c
        ON c.id = p.certificate_id
      WHERE p.user_id = $1
      ORDER BY p.updated_at DESC
      LIMIT 3
      `,
      [user.id]
    );

    res.json(projectsResult.rows);
  } catch (error) {
    console.error("[ERROR] GET /projects:", error.message);
    res.status(500).json({ error: "Erro ao buscar projetos" });
  }
});

app.get("/projects/:id", authMiddleware, async (req, res) => {
  try {
    const paramValidation = validate(idParamSchema, { id: req.params.id });
    if (!paramValidation.success) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { id } = paramValidation.data;
    const email = req.user.email;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const projectResult = await pool.query(
      `
      SELECT
        p.*,
        c.title,
        c.image_path,
        c.thumbnail_path
      FROM projects p
      JOIN certificates c
        ON c.id = p.certificate_id
      WHERE p.id = $1
      AND p.user_id = $2
      `,
      [id, user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: "Projeto não encontrado" });
    }

    res.json(projectResult.rows[0]);
  } catch (error) {
    console.error("[ERROR] GET /projects/:id:", error.message);
    res.status(500).json({ error: "Erro ao buscar projeto" });
  }
});

// ==========================================================================
// ROTAS DE ATUALIZAÇÃO E PERSISTÊNCIA CONTINUA (PUT)
// ==========================================================================

app.put("/projects/:id", authMiddleware, async (req, res) => {
  try {
    const paramValidation = validate(idParamSchema, { id: req.params.id });
    if (!paramValidation.success) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { id } = paramValidation.data;

    const bodyValidation = validate(updateProjectSchema, req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({ error: bodyValidation.errors.join(", ") });
    }

    const { nomesLista, textoCorpo, estilos, posicoes } = bodyValidation.data;
    const email = req.user.email;

    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];

    if (!user)
      return res.status(404).json({ error: "Usuário não encontrado" });

    const updatedProject = await pool.query(
      `UPDATE projects
       SET
        nomes_lista = $1,
        texto_corpo = $2,
        cor_nome = $3,
        fonte_nome = $4,
        tamanho_nome = $5,
        cor_corpo = $6,
        fonte_corpo = $7,
        tamanho_corpo = $8,
        posicao_nome = $9,
        posicao_corpo = $10,
        updated_at = NOW()
       WHERE id = $11 AND user_id = $12
       RETURNING *`,
      [
        JSON.stringify(nomesLista),
        textoCorpo,
        estilos.corNome,
        estilos.fonteNome,
        estilos.tamanhoNome,
        estilos.corCorpo,
        estilos.fonteCorpo,
        estilos.tamanhoCorpo,
        JSON.stringify(posicoes.nome),
        JSON.stringify(posicoes.corpo),
        id,
        user.id,
      ]
    );

    if (updatedProject.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Projeto não encontrado ou sem permissão" });
    }

    res.json(updatedProject.rows[0]);
  } catch (error) {
    console.error("[ERROR] PUT /projects/:id:", error.message);
    res.status(500).json({ error: "Erro ao atualizar projeto" });
  }
});

// ==========================================================================
// ROTAS DE DELEÇÃO E LIMPEZA ASSÍNCRONA (DELETE)
// ==========================================================================

app.delete("/certificates/:id", authMiddleware, async (req, res) => {
  try {
    const paramValidation = validate(idParamSchema, { id: req.params.id });
    if (!paramValidation.success) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { id } = paramValidation.data;
    const email = req.user.email;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const certResult = await pool.query(
      "SELECT * FROM certificates WHERE id = $1 AND user_id = $2",
      [id, user.id]
    );

    if (certResult.rows.length === 0) {
      return res.status(404).json({ error: "Certificado não encontrado" });
    }

    const cert = certResult.rows[0];

    const extractPath = (urlString) => {
      try {
        const url = new URL(urlString);
        const parts = url.pathname.split("/certificates/");
        return parts.length > 1 ? parts[1] : null;
      } catch {
        return null;
      }
    };

    const filesToDelete = [];
    const originalPath = extractPath(cert.image_path);
    const thumbPath = extractPath(cert.thumbnail_path);

    if (originalPath) filesToDelete.push(originalPath);
    if (thumbPath) filesToDelete.push(thumbPath);

    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from("certificates")
        .remove(filesToDelete);

      if (deleteError) {
        console.error(
          "[ERROR] DELETE storage:",
          deleteError.message
        );
      }
    }

    await pool.query(
      "DELETE FROM certificates WHERE id = $1 AND user_id = $2",
      [id, user.id]
    );

    res.json({ message: "Deletado com sucesso" });
  } catch (error) {
    console.error("[ERROR] DELETE /certificates/:id:", error.message);
    res.status(500).json({ error: "Erro ao deletar" });
  }
});

// ==========================================================================
// HANDLER GLOBAL DE ERROS (deve ser o último middleware registrado)
// ==========================================================================

app.use(errorHandler);

// ==========================================================================
// SUBSISTEMA DE MONITORAMENTO E INICIALIZAÇÃO DA PORTA
// ==========================================================================

app.get("/ping", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

export default app;
