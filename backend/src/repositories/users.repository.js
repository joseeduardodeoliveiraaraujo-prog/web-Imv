import pool from "../../db.js";

export async function upsertByFirebaseUid({ name, email, uid }) {
  return pool.query(
    `INSERT INTO users (name, email, firebase_uid)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid) DO UPDATE
       SET firebase_uid = EXCLUDED.firebase_uid
       RETURNING *`,
    [name, email, uid]
  );
}

export async function findIdByEmail(email) {
  return pool.query("SELECT id FROM users WHERE email = $1", [email]);
}
