const API_URL = import.meta.env.VITE_API_URL;

export const apiRequest = async (
  path,
  { method = "GET", token, body, headers = {} } = {}
) => {
  const isFormData = body instanceof FormData;

  return fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body && !isFormData ? JSON.stringify(body) : body,
  });
};

export const apiJson = async (path, options = {}) => {
  const response = await apiRequest(path, options);

  if (!response.ok) {
    throw new Error(options.errorMessage || "Erro na requisição");
  }

  return response.json();
};
