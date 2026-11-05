import pool from "../../db.js";

const COLUMNS = "id, name, email, created_at";

export async function findByFirebaseUid(uid) {
  return pool.query(
    `SELECT ${COLUMNS} FROM users WHERE firebase_uid = $1`,
    [uid]
  );
}

export async function findIdByFirebaseUid(uid) {
  return pool.query("SELECT id FROM users WHERE firebase_uid = $1", [uid]);
}

export async function insertIfAbsent({ name, email, uid }) {
  return pool.query(
    `INSERT INTO users (name, email, firebase_uid)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING ${COLUMNS}`,
    [name, email, uid]
  );
}

export async function updateEmail(id, email) {
  return pool.query(
    `UPDATE users SET email = $2 WHERE id = $1 RETURNING ${COLUMNS}`,
    [id, email]
  );
}

export async function relinkFirebaseUidByEmail({ email, uid }) {
  return pool.query(
    `UPDATE users SET firebase_uid = $2 WHERE email = $1 RETURNING ${COLUMNS}`,
    [email, uid]
  );
}
