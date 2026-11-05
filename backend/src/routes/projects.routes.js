import { Router } from "express";
import authMiddleware from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validate.js";
import { idParamSchema } from "../schemas/common.schema.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../schemas/projects.schema.js";
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
} from "../controllers/projects.controller.js";

const router = Router();

const validateId = validateRequest(idParamSchema, "params", {
  message: "ID inválido",
});

router.post(
  "/projects",
  authMiddleware,
  validateRequest(createProjectSchema),
  createProject
);

router.get("/projects", authMiddleware, listProjects);

router.get("/projects/:id", authMiddleware, validateId, getProject);

router.put(
  "/projects/:id",
  authMiddleware,
  validateId,
  validateRequest(updateProjectSchema),
  updateProject
);

export default router;
