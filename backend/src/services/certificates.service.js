import sharp from "sharp";
import * as certificatesRepository from "../repositories/certificates.repository.js";
import * as usersService from "./users.service.js";
import {
  buildFileName,
  extractFilePath,
  getCertificatePublicUrls,
  removeCertificateFiles,
  uploadCertificateFiles,
} from "./certificate-storage.service.js";

export async function createCertificate({ name, file, email }) {
  const user = await usersService.findAuthenticatedUserByEmail(email);

  if (!user) {
    return { status: 404, body: { error: "Usuário não encontrado" } };
  }

  const fileName = buildFileName(file.originalname);
  const thumbName = `thumb_${fileName}`;

  const thumbnailBuffer = await sharp(file.buffer)
    .resize({ width: 300 })
    .webp({ quality: 70 })
    .toBuffer();

  const uploaded = await uploadCertificateFiles({
    fileName,
    thumbName,
    file,
    thumbnailBuffer,
  });

  if (!uploaded) {
    await removeCertificateFiles([fileName, thumbName]);

    return {
      status: 500,
      body: { error: "Erro ao fazer upload do arquivo" },
    };
  }

  const urls = getCertificatePublicUrls(fileName, thumbName);

  if (!urls) {
    return {
      status: 500,
      body: { error: "Erro ao obter URLs do arquivo" },
    };
  }

  try {
    const result = await certificatesRepository.create({
      title: name,
      imagePath: urls.imageUrl,
      thumbnailPath: urls.thumbnailUrl,
      userId: user.id,
    });

    return { status: 200, body: result.rows[0] };
  } catch (dbError) {
    console.error("[ERROR] POST /certificates DB:", dbError.message);

    await removeCertificateFiles([fileName, thumbName]);

    return { status: 500, body: { error: "Erro ao salvar certificado" } };
  }
}

export async function listCertificates(email) {
  const user = await usersService.findAuthenticatedUserByEmail(email);

  if (!user) {
    return { status: 404, body: { error: "Usuário não encontrado" } };
  }

  const result = await certificatesRepository.listByUserId(user.id);
  return { status: 200, body: result.rows };
}

export async function getCertificate(id, email) {
  const user = await usersService.findAuthenticatedUserByEmail(email);

  if (!user) {
    return { status: 404, body: { error: "Usuário não encontrado" } };
  }

  const result = await certificatesRepository.findByIdAndUserId(id, user.id);

  if (result.rows.length === 0) {
    return { status: 404, body: { error: "Certificado não encontrado" } };
  }

  return { status: 200, body: result.rows[0] };
}

export async function deleteCertificate(id, email) {
  const user = await usersService.findAuthenticatedUserByEmail(email);

  if (!user) {
    return { status: 404, body: { error: "Usuário não encontrado" } };
  }

  const result = await certificatesRepository.findByIdAndUserId(id, user.id);

  if (result.rows.length === 0) {
    return { status: 404, body: { error: "Certificado não encontrado" } };
  }

  const certificate = result.rows[0];
  const filesToDelete = [];

  const originalPath = extractFilePath(certificate.image_path);
  const thumbPath = extractFilePath(certificate.thumbnail_path);

  if (originalPath) filesToDelete.push(originalPath);
  if (thumbPath) filesToDelete.push(thumbPath);

  if (filesToDelete.length > 0) {
    const { error: deleteError } = await removeCertificateFiles(filesToDelete);

    if (deleteError) {
      console.error("[ERROR] DELETE storage:", deleteError.message);
    }
  }

  await certificatesRepository.removeByIdAndUserId(id, user.id);

  return { status: 200, body: { message: "Deletado com sucesso" } };
}
