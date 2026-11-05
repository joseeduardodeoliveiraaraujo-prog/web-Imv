import { randomUUID } from "node:crypto";
import supabase from "../config/supabase.js";

const BUCKET = "certificates";
const CACHE_CONTROL = "31536000";

const EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
};

export function buildFilePaths(userId, contentType) {
  const id = randomUUID();

  return {
    fileName: `${userId}/${id}.${EXTENSIONS[contentType]}`,
    thumbName: `${userId}/${id}_thumb.webp`,
  };
}

/**
 * Envia original e thumbnail em paralelo.
 * Retorna os caminhos efetivamente enviados para que o rollback
 * remova apenas o que esta requisição criou.
 */
export async function uploadCertificateFiles({
  fileName,
  thumbName,
  file,
  contentType,
  thumbnailBuffer,
}) {
  const uploads = [
    { path: fileName, body: file.buffer, contentType },
    { path: thumbName, body: thumbnailBuffer, contentType: "image/webp" },
  ];

  const results = await Promise.allSettled(
    uploads.map(({ path, body, contentType: type }) =>
      supabase.storage.from(BUCKET).upload(path, body, {
        cacheControl: CACHE_CONTROL,
        contentType: type,
      })
    )
  );

  const uploadedPaths = [];
  let failure = null;

  results.forEach((result, index) => {
    const error =
      result.status === "rejected" ? result.reason : result.value.error;

    if (error) {
      failure ??= error;
    } else {
      uploadedPaths.push(uploads[index].path);
    }
  });

  if (failure) {
    console.error("[ERROR] Upload Storage:", failure.message);
  }

  return { ok: !failure, uploadedPaths };
}

export function getCertificatePublicUrls(fileName, thumbName) {
  const { data: imageData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  const { data: thumbData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(thumbName);

  if (!imageData?.publicUrl || !thumbData?.publicUrl) {
    return null;
  }

  return {
    imageUrl: imageData.publicUrl,
    thumbnailUrl: thumbData.publicUrl,
  };
}

/**
 * Remoção "best-effort": registra falhas sem lançar, para não mascarar
 * o erro original de quem chamou nem desfazer uma exclusão já feita no banco.
 */
export async function removeCertificateFilesSafely(fileNames) {
  if (fileNames.length === 0) return;

  try {
    const { error } = await supabase.storage.from(BUCKET).remove(fileNames);
    if (error) {
      console.error("[ERROR] Remoção Storage:", error.message, fileNames);
    }
  } catch (error) {
    console.error("[ERROR] Remoção Storage:", error.message, fileNames);
  }
}

export function extractFilePath(urlString) {
  try {
    const url = new URL(urlString);
    const parts = url.pathname.split("/certificates/");
    return parts.length > 1 ? decodeURIComponent(parts[1]) : null;
  } catch {
    return null;
  }
}
