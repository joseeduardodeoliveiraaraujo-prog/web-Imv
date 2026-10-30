import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo")
    .trim(),
  email: z.string().email("E-mail inválido").optional(),
  uid: z.string().min(1, "UID é obrigatório").optional(),
});
