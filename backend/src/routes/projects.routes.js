import { Router } from "express";
import authMiddleware from "../../middleware/auth.js";
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
} from "../controllers/projects.controller.js";

const router = Router();

router.post("/projects", authMiddleware, createProject);

router.get("/projects", authMiddleware, listProjects);

router.get("/projects/:id", authMiddleware, getProject);

router.put("/projects/:id", authMiddleware, updateProject);

export default router;
