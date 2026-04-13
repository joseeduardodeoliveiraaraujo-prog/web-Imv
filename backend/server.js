import express from "express";
import cors from "cors";
import pool from "./db.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

app.get("/test-db", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json(result.rows);
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});