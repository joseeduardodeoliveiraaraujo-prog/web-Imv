import express from "express";
import cors from "cors";
import pool from "./db.js";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

app.get("/test-db", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json(result.rows);
});

app.post("/users", async (req, res) => {
  try {
    const { name, email, uid } = req.body;

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE firebase_uid = $1",
      [uid]
    );

    if (existingUser.rows.length > 0) {
      return res.json(existingUser.rows[0]);
    }

    const result = await pool.query(
      "INSERT INTO users (name, email, firebase_uid) VALUES ($1, $2, $3) RETURNING *",
      [name, email, uid]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar usuário" });
  }
});

app.get("/ping", (req, res) => {
  res.json({ ok: true });
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});

