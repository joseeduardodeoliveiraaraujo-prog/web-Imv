import { validate } from "../../middleware/validate.js";
import { idParamSchema } from "../schemas/common.schema.js";
import { createCertificateSchema } from "../schemas/certificates.schema.js";
import * as certificatesService from "../services/certificates.service.js";

export async function createCertificate(req, res) {
  try {
    const validation = validate(createCertificateSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.errors.join(", ") });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    const result = await certificatesService.createCertificate({
      name: validation.data.name,
      file,
      email: req.user.email,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("[ERROR] POST /certificates:", error.message);
    return res.status(500).json({ error: "Erro ao salvar certificado" });
  }
}

export async function listCertificates(req, res) {
  try {
    const result = await certificatesService.listCertificates(req.user.email);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("[ERROR] GET /certificates:", error.message);
    return res.status(500).json({ error: "Erro ao buscar certificados" });
  }
}

export async function getCertificate(req, res) {
  try {
    const paramValidation = validate(idParamSchema, { id: req.params.id });
    if (!paramValidation.success) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const result = await certificatesService.getCertificate(
      paramValidation.data.id,
      req.user.email
    );

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("[ERROR] GET /certificates/:id:", error.message);
    return res.status(500).json({ error: "Erro ao buscar certificado" });
  }
}

export async function deleteCertificate(req, res) {
  try {
    const paramValidation = validate(idParamSchema, { id: req.params.id });
    if (!paramValidation.success) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const result = await certificatesService.deleteCertificate(
      paramValidation.data.id,
      req.user.email
    );

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("[ERROR] DELETE /certificates/:id:", error.message);
    return res.status(500).json({ error: "Erro ao deletar" });
  }
}
