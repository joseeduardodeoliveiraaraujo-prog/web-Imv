import { Router } from "express";
import authMiddleware from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validate.js";
import { createUserSchema } from "../schemas/users.schema.js";
import { syncUser } from "../controllers/users.controller.js";

const router = Router();

router.post(
  "/users",
  authMiddleware,
  validateRequest(createUserSchema),
  syncUser
);

export default router;
