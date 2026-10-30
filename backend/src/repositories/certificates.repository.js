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

export async function listByUserId(userId) {
  return pool.query(
    "SELECT * FROM certificates WHERE user_id = $1 ORDER BY id DESC",
    [userId]
  );
}

export async function findByIdAndUserId(id, userId) {
  return pool.query(
    "SELECT * FROM certificates WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
}

export async function removeByIdAndUserId(id, userId) {
  return pool.query(
    "DELETE FROM certificates WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
}
