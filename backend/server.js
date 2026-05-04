import express from "express";
import cors from "cors";
import pool from "./db.js";
import authMiddleware from "./middleware/auth.js";
import multer from "multer";
import "dotenv/config";
import fs from "fs";
import path from "path";

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

app.use("/uploads", express.static("uploads"));

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
  dest: "uploads/",
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

    const result = await pool.query(
      "INSERT INTO certificates (title, image_path, user_id) VALUES ($1, $2, $3) RETURNING *",
      [name, file.filename, user.id]
    );

    res.json(result.rows[0]);

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

    const result = await pool.query(
      "SELECT * FROM certificates WHERE user_id = $1 ORDER BY id DESC",
      [user.id]
    );

    res.json(result.rows);

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

    const result = await pool.query(
      "DELETE FROM certificates WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Certificado não encontrado" });
    }

    const cert = result.rows[0];
      if (cert.image_path) {
        const filePath = path.join("uploads", cert.image_path);

        fs.unlink(filePath, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error("Erro ao deletar arquivo:", err);
          }
        });
      }

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

