import sharp from "sharp";
import * as certificatesRepository from "../repositories/certificates.repository.js";
import * as usersService from "./users.service.js";
import {
  AppError,
  BadRequestError,
  NotFoundError,
} from "../errors/app-errors.js";
import {
  buildFilePaths,
  extractFilePath,
  getCertificatePublicUrls,
  removeCertificateFilesSafely,
  uploadCertificateFiles,
} from "./certificate-storage.service.js";

const ALLOWED_IMAGE_FORMATS = {
  png: "image/png",
  jpeg: "image/jpeg",
};

// Cerca de 50 MP: cobre um A4 em 600 DPI (~35 MP) e bloqueia imagens
// pequenas em bytes que descomprimem para centenas de MB de memória.
export const MAX_INPUT_PIXELS = 50_000_000;

async function detectImageContentType(buffer) {
  try {
    const { format } = await sharp(buffer, {
      limitInputPixels: MAX_INPUT_PIXELS,
    }).metadata();

    return ALLOWED_IMAGE_FORMATS[format] ?? null;
  } catch {
    return null;
  }
}

async function findOwnedCertificate(id, uid) {
  const result = await certificatesRepository.findByIdAndFirebaseUid(id, uid);

  if (result.rows.length === 0) {
    throw new NotFoundError("Usuário não encontrado");
  }

  if (result.rows[0].id === null) {
    throw new NotFoundError("Certificado não encontrado");
  }

  return result.rows[0];
}

export async function createCertificate({ name, file, uid }) {
  const userId = await usersService.requireUserId(uid);

  const contentType = await detectImageContentType(file.buffer);

  if (!contentType) {
    throw new BadRequestError(
      "Envie uma imagem PNG ou JPEG válida de até 50 megapixels"
    );
  }

  const { fileName, thumbName } = buildFilePaths(userId, contentType);

  const thumbnailBuffer = await sharp(file.buffer, {
    limitInputPixels: MAX_INPUT_PIXELS,
  })
    .resize({ width: 300 })
    .webp({ quality: 70 })
    .toBuffer();

  const { ok, uploadedPaths } = await uploadCertificateFiles({
    fileName,
    thumbName,
    file,
    contentType,
    thumbnailBuffer,
  });

  if (!ok) {
    await removeCertificateFilesSafely(uploadedPaths);
    throw new AppError(500, "Erro ao fazer upload do arquivo");
  }

  const urls = getCertificatePublicUrls(fileName, thumbName);

  if (!urls) {
    await removeCertificateFilesSafely(uploadedPaths);
    throw new AppError(500, "Erro ao obter URLs do arquivo");
  }

  try {
    const result = await certificatesRepository.create({
      title: name,
      imagePath: urls.imageUrl,
      thumbnailPath: urls.thumbnailUrl,
      userId,
    });

    return result.rows[0];
  } catch (dbError) {
    await removeCertificateFilesSafely(uploadedPaths);
    throw dbError;
  }
}

export async function listCertificates(uid) {
  const result = await certificatesRepository.listByFirebaseUid(uid);

  if (result.rows.length === 0) {
    throw new NotFoundError("Usuário não encontrado");
  }

  return result.rows.filter((row) => row.id !== null);
}

export async function getCertificate(id, uid) {
  return findOwnedCertificate(id, uid);
}

/**
 * Remove primeiro o registro (fonte da verdade) e depois os arquivos.
 * Se o Storage falhar, sobram apenas arquivos órfãos registrados em log,
 * nunca um registro apontando para imagens inexistentes.
 */
export async function deleteCertificate(id, uid) {
  const certificate = await findOwnedCertificate(id, uid);

  await certificatesRepository.removeByIdAndUserId(
    certificate.id,
    certificate.user_id
  );

  const filesToDelete = [
    extractFilePath(certificate.image_path),
    extractFilePath(certificate.thumbnail_path),
  ].filter(Boolean);

  await removeCertificateFilesSafely(filesToDelete);

  return { message: "Deletado com sucesso" };
}
