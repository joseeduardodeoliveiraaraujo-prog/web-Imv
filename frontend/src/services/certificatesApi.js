import { apiJson, apiRequest } from "./api";

const CERTIFICATES_PATH = "/certificates";

export const listCertificates = (token) =>
  apiJson(CERTIFICATES_PATH, {
    token,
    errorMessage: "Erro ao carregar certificados",
  });

export const getCertificate = (id, token) =>
  apiJson(`${CERTIFICATES_PATH}/${id}`, {
    token,
    errorMessage: "Erro ao carregar",
  });

export const uploadCertificate = (file, token) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", file.name);

  return apiJson(CERTIFICATES_PATH, {
    method: "POST",
    token,
    body: formData,
    errorMessage: "Erro no upload",
  });
};

export const deleteCertificate = async (id, token) => {
  const response = await apiRequest(`${CERTIFICATES_PATH}/${id}`, {
    method: "DELETE",
    token,
  });

  if (!response.ok) {
    throw new Error("Erro ao deletar");
  }
};
