import { apiRequest } from "./api";

let syncPromise = null;
let syncUid = null;
let syncedUid = null;

const syncUser = async (user, token) => {
  const authToken = token || (await user.getIdToken());

  // E-mail e UID vêm do token no backend; o body só informa o nome de exibição.
  const response = await apiRequest("/users", {
    method: "POST",
    token: authToken,
    body: { name: user.displayName || "Sem nome" },
  });

  if (!response.ok) {
    const error = new Error("Erro ao salvar usuário");
    error.status = response.status;
    throw error;
  }

  return response;
};

/**
 * Mensagem para o usuário quando a sincronização falha por um motivo que
 * ele precisa conhecer (ex.: e-mail já vinculado a outro cadastro).
 */
export const getSyncErrorMessage = (error) => {
  if (error?.status === 409) {
    return "Este e-mail já está vinculado a outro cadastro. Fale com o administrador do sistema.";
  }

  return null;
};

/**
 * Ponto único de sincronização: chamadas concorrentes para o mesmo usuário
 * compartilham a mesma requisição, e um usuário já sincronizado não gera nova chamada.
 */
export const ensureUserSynced = (user, token) => {
  if (!user) return Promise.resolve(null);
  if (syncedUid === user.uid) return Promise.resolve(null);

  if (!syncPromise || syncUid !== user.uid) {
    syncUid = user.uid;
    const promise = syncUser(user, token)
      .then(() => {
        syncedUid = user.uid;
        return null;
      })
      .finally(() => {
        if (syncPromise === promise) {
          syncPromise = null;
          syncUid = null;
        }
      });

    syncPromise = promise;
  }

  return syncPromise;
};
