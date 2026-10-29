import { apiRequest } from "./api";

export const syncUser = async (user) => {
  const token = await user.getIdToken();

  return apiRequest("/users", {
    method: "POST",
    token,
    body: {
      name: user.displayName || "Sem nome",
      email: user.email,
      uid: user.uid,
    },
  });
};
