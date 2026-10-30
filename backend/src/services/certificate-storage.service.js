import supabase from "../config/supabase.js";

const BUCKET = "certificates";

export function buildFileName(originalName) {
  const safeName = originalName
    .replace(/\s+/g, "_")
    .replace(/[^\w.-]/g, "");

  return `${Date.now()}_${safeName}`;
}

export async function uploadCertificateFiles({
  fileName,
  thumbName,
  file,
  thumbnailBuffer,
}) {
  const [originalUpload, thumbUpload] = await Promise.all([
    supabase.storage.from(BUCKET).upload(fileName, file.buffer, {
      cacheControl: "31536000",
      contentType: file.mimetype,
    }),
    supabase.storage.from(BUCKET).upload(thumbName, thumbnailBuffer, {
      cacheControl: "31536000",
      contentType: "image/webp",
    }),
  ]);

  if (originalUpload.error || thumbUpload.error) {
    console.error(
      "Erro no upload:",
      originalUpload.error || thumbUpload.error
    );

    return false;
  }

  return true;
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

export async function removeCertificateFiles(fileNames) {
  return supabase.storage.from(BUCKET).remove(fileNames);
}

export function extractFilePath(urlString) {
  try {
    const url = new URL(urlString);
    const parts = url.pathname.split("/certificates/");
    return parts.length > 1 ? parts[1] : null;
  } catch {
    return null;
  }
}
