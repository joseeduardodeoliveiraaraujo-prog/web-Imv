import { z } from "zod";

export const DEFAULT_USER_NAME = "Sem nome";
export const MAX_USER_NAME_LENGTH = 100;

// O nome vem do displayName do Firebase e não deve impedir a sincronização:
// vazio vira o padrão e nomes longos são cortados no tamanho da coluna.
export const createUserSchema = z.object({
  name: z
    .string({ error: "Nome deve ser um texto" })
    .optional()
    .transform((value) => {
      const trimmed = (value ?? "").trim();
      return trimmed ? trimmed.slice(0, MAX_USER_NAME_LENGTH) : DEFAULT_USER_NAME;
    }),
});
