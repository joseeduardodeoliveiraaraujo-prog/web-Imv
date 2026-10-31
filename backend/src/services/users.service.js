import * as usersRepository from "../repositories/users.repository.js";

export async function syncUser({ name, email, uid }) {
  const result = await usersRepository.upsertByFirebaseUid({
    name,
    email,
    uid,
  });

  return result.rows[0];
}

export async function findAuthenticatedUserIdByEmail(email) {
  const result = await usersRepository.findIdByEmail(email);
  return result.rows[0];
}
