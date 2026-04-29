import express from "express";
import cors from "cors";
import pool from "./db.js";
import authMiddleware from "./middleware/auth.js";
import multer from "multer";
import "dotenv/config";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

app.get("/test-db", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json(result.rows);
});

// Rota para criar ou obter usuário
app.post("/users", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const email = req.user.email;
    const uid = req.user.uid;

    const result = await pool.query(
      `INSERT INTO users (name, email, firebase_uid)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING *`,
      [name, email, uid]
    );

    if (result.rows.length === 0) {
      const existingUser = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      return res.json(existingUser.rows[0]);
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar usuário" });
  }
});

const upload = multer({ dest: "uploads/" });

app.post("/certificates", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { name } = req.body;
    const file = req.file;

    const email = req.user.email;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

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
    const email = req.user.email;

    // pega o usuário
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

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

    res.json({ message: "Deletado com sucesso" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar" });
  }
});

app.get("/ping", (req, res) => {
  res.json({ ok: true });
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});

