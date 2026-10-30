import { createUserSchema } from "../src/schemas/users.schema.js";
import { createCertificateSchema } from "../src/schemas/certificates.schema.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../src/schemas/projects.schema.js";
import { idParamSchema } from "../src/schemas/common.schema.js";

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
