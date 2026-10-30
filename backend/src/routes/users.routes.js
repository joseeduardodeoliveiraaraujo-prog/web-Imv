import { Router } from "express";
import authMiddleware from "../../middleware/auth.js";
import { syncUser } from "../controllers/users.controller.js";

const router = Router();

router.post("/users", authMiddleware, syncUser);

export default router;
