import { Router } from "express";
import pool from "../../db.js";

const router = Router();

router.get("/", (req, res) => {
  res.send("Backend funcionando");
});

router.get("/test-db", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    console.error("[ERROR] /test-db:", error.message);
    res.status(500).json({ error: "Erro no banco" });
  }
});

router.get("/ping", (req, res) => {
  res.json({ ok: true });
});

export default router;
