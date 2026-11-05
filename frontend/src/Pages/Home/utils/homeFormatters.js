export const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR");
};

export const getExtension = (name = "") => {
  if (!name.includes(".")) return "IMG";

  const extension = name.split(".").pop().toUpperCase();
  return extension === "JPEG" ? "JPG" : extension.slice(0, 4);
};

export const formatCertificate = (cert) => ({
  id: cert.id,
  name: cert.title,
  previewUrl: cert.thumbnail_path,
  originalUrl: cert.image_path,
  createdAt: formatDate(cert.created_at),
  createdAtRaw: cert.created_at,
  extension: getExtension(cert.title),
});

export const getRequestErrorMessage = (error, fallback) => {
  if (error?.status === 429) {
    return "Muitas requisições. Aguarde alguns instantes e tente novamente.";
  }

  return fallback;
};

export const formatLastModified = (value, now = new Date()) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const isToday = date.toDateString() === now.toDateString();

  return isToday
    ? `Hoje, ${date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : date.toLocaleDateString("pt-BR");
};

export const countCreatedThisMonth = (certificates, now = new Date()) =>
  certificates.filter((certificate) => {
    if (!certificate.createdAtRaw) return false;

    const date = new Date(certificate.createdAtRaw);
    return (
      !Number.isNaN(date.getTime()) &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;
