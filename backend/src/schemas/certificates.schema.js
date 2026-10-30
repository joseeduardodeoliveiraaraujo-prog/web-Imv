import { z } from "zod";

export const createCertificateSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(200, "Nome muito longo")
    .trim(),
});
