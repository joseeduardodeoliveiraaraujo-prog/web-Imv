import { validate } from "../../middleware/validate.js";
import { idParamSchema } from "../schemas/common.schema.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../schemas/projects.schema.js";
import * as projectsService from "../services/projects.service.js";

export async function createProject(req, res) {
  try {
    const validation = validate(createProjectSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.errors.join(", ") });
    }

    const result = await projectsService.createProject({
      payload: validation.data,
      email: req.user.email,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("[ERROR] POST /projects:", error.message);
    return res.status(500).json({ error: "Erro ao salvar projeto" });
  }
}

export async function listProjects(req, res) {
  try {
    const result = await projectsService.listProjects(req.user.email);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("[ERROR] GET /projects:", error.message);
    return res.status(500).json({ error: "Erro ao buscar projetos" });
  }
}

export async function getProject(req, res) {
  try {
    const paramValidation = validate(idParamSchema, { id: req.params.id });
    if (!paramValidation.success) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const result = await projectsService.getProject(
      paramValidation.data.id,
      req.user.email
    );

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("[ERROR] GET /projects/:id:", error.message);
    return res.status(500).json({ error: "Erro ao buscar projeto" });
  }
}

export async function updateProject(req, res) {
  try {
    const paramValidation = validate(idParamSchema, { id: req.params.id });
    if (!paramValidation.success) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const bodyValidation = validate(updateProjectSchema, req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({ error: bodyValidation.errors.join(", ") });
    }

    const result = await projectsService.updateProject({
      id: paramValidation.data.id,
      payload: bodyValidation.data,
      email: req.user.email,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("[ERROR] PUT /projects/:id:", error.message);
    return res.status(500).json({ error: "Erro ao atualizar projeto" });
  }
}
