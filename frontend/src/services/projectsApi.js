import { apiJson } from "./api";

const PROJECTS_PATH = "/projects";

export const listProjects = (token) =>
  apiJson(PROJECTS_PATH, {
    token,
    errorMessage: "Erro ao buscar projetos",
  });

export const getProject = (id, token) =>
  apiJson(`${PROJECTS_PATH}/${id}`, {
    token,
    errorMessage: "Erro ao carregar",
  });

export const createProject = (payload, token) =>
  apiJson(PROJECTS_PATH, {
    method: "POST",
    token,
    body: payload,
    errorMessage: "Erro ao salvar projeto",
  });

export const updateProject = (id, payload, token) =>
  apiJson(`${PROJECTS_PATH}/${id}`, {
    method: "PUT",
    token,
    body: payload,
    errorMessage: "Erro ao salvar projeto",
  });
