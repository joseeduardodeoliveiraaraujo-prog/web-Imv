import { Router } from "express";
import authMiddleware from "../../middleware/auth.js";
import upload from "../../middleware/upload.js";
import { uploadLimiter } from "../../middleware/rateLimiter.js";
import {
  createCertificate,
  deleteCertificate,
  getCertificate,
  listCertificates,
} from "../controllers/certificates.controller.js";

const router = Router();

router.post(
  "/certificates",
  authMiddleware,
  uploadLimiter,
  upload.single("file"),
  createCertificate
);

router.get("/certificates", authMiddleware, listCertificates);

router.get("/certificates/:id", authMiddleware, getCertificate);

router.delete("/certificates/:id", authMiddleware, deleteCertificate);

export default router;
