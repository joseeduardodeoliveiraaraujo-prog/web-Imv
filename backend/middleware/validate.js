import { createUserSchema } from "../src/schemas/users.schema.js";
import { createCertificateSchema } from "../src/schemas/certificates.schema.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../src/schemas/projects.schema.js";
import { idParamSchema } from "../src/schemas/common.schema.js";
import { BadRequestError } from "../src/errors/app-errors.js";

export {
  createUserSchema,
  createCertificateSchema,
  createProjectSchema,
  updateProjectSchema,
  idParamSchema,
};

export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message);
    return { success: false, errors: messages };
  }
  return { success: true, data: result.data };
}

/**
 * Valida req[source] e guarda o resultado em req.validated[source].
 * `message` substitui as mensagens do schema na resposta 400.
 */
export function validateRequest(schema, source = "body", { message } = {}) {
  return (req, _res, next) => {
    const result = validate(schema, req[source] ?? {});

    if (!result.success) {
      return next(new BadRequestError(message ?? result.errors.join(", ")));
    }

    req.validated = { ...req.validated, [source]: result.data };
    next();
  };
}
