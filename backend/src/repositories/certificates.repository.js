import pool from "../../db.js";

const COLUMNS = ["id", "title", "image_path", "thumbnail_path", "created_at"];
const columns = (alias) =>
  COLUMNS.map((column) => (alias ? `${alias}.${column}` : column)).join(", ");

export async function create({
  title,
  imagePath,
  thumbnailPath,
  userId,
}) {
  return pool.query(
    `INSERT INTO certificates (title, image_path, thumbnail_path, user_id) VALUES ($1, $2, $3, $4) RETURNING ${columns()}`,
    [title, imagePath, thumbnailPath, userId]
  );
}

export async function listByFirebaseUid(uid) {
  return pool.query(
    `SELECT ${columns("c")}
       FROM users u
       LEFT JOIN certificates c ON c.user_id = u.id
       WHERE u.firebase_uid = $1
       ORDER BY c.id DESC`,
    [uid]
  );
}

export async function findByIdAndFirebaseUid(id, uid) {
  return pool.query(
    `SELECT ${columns("c")}, c.user_id
       FROM users u
       LEFT JOIN certificates c ON c.user_id = u.id AND c.id = $2
       WHERE u.firebase_uid = $1`,
    [uid, id]
  );
}

export async function removeByIdAndUserId(id, userId) {
  return pool.query(
    "DELETE FROM certificates WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
}
