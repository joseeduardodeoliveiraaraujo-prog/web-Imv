import { apiRequest } from "./api";

let syncPromise = null;
let syncUid = null;
let syncedUid = null;

export const syncUser = async (user, token) => {
  const authToken = token || (await user.getIdToken());

  const response = await apiRequest("/users", {
    method: "POST",
    token: authToken,
    body: {
      name: user.displayName || "Sem nome",
      email: user.email,
      uid: user.uid,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao salvar usuário");
  }

  return response;
};

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
