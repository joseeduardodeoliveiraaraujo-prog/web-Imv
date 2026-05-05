import express from "express";
import cors from "cors";
import pool from "./db.js";
import authMiddleware from "./middleware/auth.js";
import multer from "multer";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const app = express();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Erro no banco" });
  }
});

// Rota para criar ou obter usuário
app.post("/users", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const file = req.file;

    if (!name || name.length < 3) {
      return res.status(400).json({ error: "Nome inválido" });
    }

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
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar usuário" });
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas"));
    }
  }
});

app.post("/certificates", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.length < 3) {
      return res.status(400).json({ error: "Nome inválido" });
    }

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
      .resize({ width: 300 }) // largura padrão
      .webp({ quality: 70 }) // comprime
      .toBuffer();

    const [originalUpload, thumbUpload] = await Promise.all([
  supabase.storage.from("certificates").upload(fileName, file.buffer, {
    cacheControl: "31536000", // 1 ano
    contentType: file.mimetype
  }),
  supabase.storage.from("certificates").upload(thumbname, thumbnailBuffer, {
    cacheControl: "31536000", // 1 ano
    contentType: "image/webp"
  })
]);

// tratamento de erro
if (originalUpload.error || thumbUpload.error) {
  console.error("Erro no upload:", originalUpload.error || thumbUpload.error);

  // rollback se algum falhar
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
      console.error("Erro no banco, rollback do storage...");

      await supabase.storage
        .from("certificates")
        .remove([fileName, thumbname]);

      return res.status(500).json({ error: "Erro ao salvar certificado" });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar certificado" });
  }
});

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
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar certificados" });
  }
});

app.get("/certificates/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
      if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const email = req.user.email;

    // pega o usuário
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // pega o certificado DO USUÁRIO
    const certResult = await pool.query(
      "SELECT * FROM certificates WHERE id = $1 AND user_id = $2",
      [id, user.id]
    );

    if (certResult.rows.length === 0) {
      return res.status(404).json({ error: "Certificado não encontrado" });
    }

    res.json(certResult.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar certificado" });
  }
});

app.delete("/certificates/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
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
        console.error("Erro ao deletar arquivos do storage:", deleteError);
      }
    }

     await pool.query(
      "DELETE FROM certificates WHERE id = $1 AND user_id = $2",
      [id, user.id]
    );

    res.json({ message: "Deletado com sucesso" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar" });
  }
});

app.get("/ping", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

