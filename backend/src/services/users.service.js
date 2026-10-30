import * as usersRepository from "../repositories/users.repository.js";

export async function syncUser({ name, email, uid }) {
  const created = await usersRepository.createByFirebaseUid({
    name,
    email,
    uid,
  });

  if (created.rows.length === 0) {
    const existing = await usersRepository.findByFirebaseUid(uid);
    return existing.rows[0];
  }

  return created.rows[0];
}

export async function findAuthenticatedUserByEmail(email) {
  const result = await usersRepository.findByEmail(email);
  return result.rows[0];
}

export async function findAuthenticatedUserIdByEmail(email) {
  const result = await usersRepository.findIdByEmail(email);
  return result.rows[0];
}
