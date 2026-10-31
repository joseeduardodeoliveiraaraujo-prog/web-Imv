import * as projectsRepository from "../repositories/projects.repository.js";
import * as usersService from "./users.service.js";

export async function createProject({ payload, email }) {
  const user = await usersService.findAuthenticatedUserIdByEmail(email);

  if (!user) {
    return { status: 404, body: { error: "Usuário não encontrado" } };
  }

  const { nomesLista, textoCorpo, estilos, certificadoId, posicoes } = payload;

  const result = await projectsRepository.create({
    userId: user.id,
    certificateId: certificadoId,
    nomesLista,
    textoCorpo,
    estilos,
    posicoes,
  });

  const projectsResult = await projectsRepository.listIdsByUserId(user.id);
  const projects = projectsResult.rows;

  if (projects.length > 3) {
    const idsToRemove = projects.slice(3).map((project) => project.id);
    await projectsRepository.removeByIds(idsToRemove);
  }

  return { status: 200, body: result.rows[0] };
}

export async function listProjects(email) {
  const result = await projectsRepository.listRecentByUserEmail(email);

  if (result.rows.length === 0) {
    return { status: 404, body: { error: "Usuário não encontrado" } };
  }

  const projects = result.rows.filter((row) => row.id !== null);
  return { status: 200, body: projects };
}

export async function getProject(id, email) {
  const result = await projectsRepository.findByIdAndUserEmail(id, email);

  if (result.rows.length === 0) {
    return { status: 404, body: { error: "Usuário não encontrado" } };
  }

  if (result.rows[0].id === null) {
    return { status: 404, body: { error: "Projeto não encontrado" } };
  }

  return { status: 200, body: result.rows[0] };
}

export async function updateProject({ id, payload, email }) {
  const user = await usersService.findAuthenticatedUserIdByEmail(email);

  if (!user) {
    return { status: 404, body: { error: "Usuário não encontrado" } };
  }

  const { nomesLista, textoCorpo, estilos, posicoes } = payload;

  const result = await projectsRepository.updateByIdAndUserId({
    id,
    userId: user.id,
    nomesLista,
    textoCorpo,
    estilos,
    posicoes,
  });

  if (result.rows.length === 0) {
    return {
      status: 404,
      body: { error: "Projeto não encontrado ou sem permissão" },
    };
  }

  return { status: 200, body: result.rows[0] };
}
