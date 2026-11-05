import * as usersRepository from "../repositories/users.repository.js";
import { ConflictError, NotFoundError } from "../errors/app-errors.js";

const UNIQUE_VIOLATION = "23505";
const EMAIL_EM_USO = "E-mail já vinculado a outra conta";

async function findByFirebaseUid(uid) {
  const result = await usersRepository.findByFirebaseUid(uid);
  return result.rows[0];
}

async function updateEmail(user, email) {
  try {
    const result = await usersRepository.updateEmail(user.id, email);
    return result.rows[0];
  } catch (error) {
    if (error.code === UNIQUE_VIOLATION) throw new ConflictError(EMAIL_EM_USO);
    throw error;
  }
}

/**
 * Sincroniza o usuário do Firebase com a tabela users usando o UID como identidade.
 * Se o e-mail já pertence a outro UID (conta Firebase recriada), o registro só é
 * re-vinculado quando o Firebase confirma que o e-mail foi verificado.
 */
export async function syncUser({ name, email, uid, emailVerified }) {
  const existing = await findByFirebaseUid(uid);

  if (existing) {
    if (email && existing.email !== email) {
      return updateEmail(existing, email);
    }
    return existing;
  }

  const inserted = await usersRepository.insertIfAbsent({ name, email, uid });
  if (inserted.rows[0]) return inserted.rows[0];

  const createdConcurrently = await findByFirebaseUid(uid);
  if (createdConcurrently) return createdConcurrently;

  if (!emailVerified) throw new ConflictError(EMAIL_EM_USO);

  const relinked = await usersRepository.relinkFirebaseUidByEmail({
    email,
    uid,
  });
  if (!relinked.rows[0]) throw new ConflictError(EMAIL_EM_USO);

  return relinked.rows[0];
}

export async function requireUserId(uid) {
  const result = await usersRepository.findIdByFirebaseUid(uid);
  const user = result.rows[0];

  if (!user) throw new NotFoundError("Usuário não encontrado");

  return user.id;
}
