import * as projectsRepository from "../repositories/projects.repository.js";
import * as usersService from "./users.service.js";
import { NotFoundError } from "../errors/app-errors.js";

const { MAX_PROJECTS_PER_USER } = projectsRepository;

export async function createProject({ payload, uid }) {
  const userId = await usersService.requireUserId(uid);

  const { nomesLista, textoCorpo, estilos, certificadoId, posicoes } = payload;

  const result = await projectsRepository.create({
    userId,
    certificateId: certificadoId,
    nomesLista,
    textoCorpo,
    estilos,
    posicoes,
  });

  if (result.rows.length === 0) {
    throw new NotFoundError("Certificado não encontrado");
  }

  const projectsResult = await projectsRepository.listIdsByUserId(userId);
  const projects = projectsResult.rows;

  if (projects.length > MAX_PROJECTS_PER_USER) {
    const idsToRemove = projects
      .slice(MAX_PROJECTS_PER_USER)
      .map((project) => project.id);
    await projectsRepository.removeByIds(idsToRemove);
  }

  return result.rows[0];
}

export async function listProjects(uid) {
  const result = await projectsRepository.listRecentByFirebaseUid(uid);

  if (result.rows.length === 0) {
    throw new NotFoundError("Usuário não encontrado");
  }

  return result.rows.filter((row) => row.id !== null);
}

export async function getProject(id, uid) {
  const result = await projectsRepository.findByIdAndFirebaseUid(id, uid);

  if (result.rows.length === 0) {
    throw new NotFoundError("Usuário não encontrado");
  }

  if (result.rows[0].id === null) {
    throw new NotFoundError("Projeto não encontrado");
  }

  return result.rows[0];
}

export async function updateProject({ id, payload, uid }) {
  const userId = await usersService.requireUserId(uid);

  const { nomesLista, textoCorpo, estilos, posicoes } = payload;

  const result = await projectsRepository.updateByIdAndUserId({
    id,
    userId,
    nomesLista,
    textoCorpo,
    estilos,
    posicoes,
  });

  if (result.rows.length === 0) {
    throw new NotFoundError("Projeto não encontrado ou sem permissão");
  }

  return result.rows[0];
}
