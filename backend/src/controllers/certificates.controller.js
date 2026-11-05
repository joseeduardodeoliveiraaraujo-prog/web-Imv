import { BadRequestError } from "../errors/app-errors.js";
import * as certificatesService from "../services/certificates.service.js";

export async function createCertificate(req, res) {
  if (!req.file) {
    throw new BadRequestError("Arquivo não enviado");
  }

  const certificate = await certificatesService.createCertificate({
    name: req.validated.body.name,
    file: req.file,
    uid: req.user.uid,
  });

  res.json(certificate);
}

export async function listCertificates(req, res) {
  res.json(await certificatesService.listCertificates(req.user.uid));
}

export async function getCertificate(req, res) {
  res.json(
    await certificatesService.getCertificate(
      req.validated.params.id,
      req.user.uid
    )
  );
}

export async function deleteCertificate(req, res) {
  res.json(
    await certificatesService.deleteCertificate(
      req.validated.params.id,
      req.user.uid
    )
  );
}
