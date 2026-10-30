import { z } from "zod";

export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID deve ser um número")
    .transform(Number),
});
