import pool from "../../db.js";

export async function createByFirebaseUid({ name, email, uid }) {
  return pool.query(
    `INSERT INTO users (name, email, firebase_uid)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid) DO NOTHING
       RETURNING *`,
    [name, email, uid]
  );
}

export async function findByFirebaseUid(uid) {
  return pool.query("SELECT * FROM users WHERE firebase_uid = $1", [uid]);
}

export async function findByEmail(email) {
  return pool.query("SELECT * FROM users WHERE email = $1", [email]);
}

export async function findIdByEmail(email) {
  return pool.query("SELECT id FROM users WHERE email = $1", [email]);
}
