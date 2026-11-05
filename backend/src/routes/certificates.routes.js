import { Router } from "express";
import authMiddleware from "../../middleware/auth.js";
import upload from "../../middleware/upload.js";
import { uploadLimiter } from "../../middleware/rateLimiter.js";
import { validateRequest } from "../../middleware/validate.js";
import { idParamSchema } from "../schemas/common.schema.js";
import { createCertificateSchema } from "../schemas/certificates.schema.js";
import {
  createCertificate,
  deleteCertificate,
  getCertificate,
  listCertificates,
} from "../controllers/certificates.controller.js";

const router = Router();

const validateId = validateRequest(idParamSchema, "params", {
  message: "ID inválido",
});

router.post(
  "/certificates",
  authMiddleware,
  uploadLimiter,
  upload.single("file"),
  validateRequest(createCertificateSchema),
  createCertificate
);

router.get("/certificates", authMiddleware, listCertificates);

router.get("/certificates/:id", authMiddleware, validateId, getCertificate);

router.delete(
  "/certificates/:id",
  authMiddleware,
  validateId,
  deleteCertificate
);

export default router;
