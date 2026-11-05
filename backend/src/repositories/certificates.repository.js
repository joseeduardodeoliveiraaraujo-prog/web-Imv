import pool from "../../db.js";

export async function create({
  title,
  imagePath,
  thumbnailPath,
  userId,
}) {
  return pool.query(
    "INSERT INTO certificates (title, image_path, thumbnail_path, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
    [title, imagePath, thumbnailPath, userId]
  );
}

export async function listByFirebaseUid(uid) {
  return pool.query(
    `SELECT c.*
       FROM users u
       LEFT JOIN certificates c ON c.user_id = u.id
       WHERE u.firebase_uid = $1
       ORDER BY c.id DESC`,
    [uid]
  );
}

export async function findByIdAndFirebaseUid(id, uid) {
  return pool.query(
    `SELECT c.*
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
