import * as projectsService from "../services/projects.service.js";

export async function createProject(req, res) {
  res.json(
    await projectsService.createProject({
      payload: req.validated.body,
      uid: req.user.uid,
    })
  );
}

export async function listProjects(req, res) {
  res.json(await projectsService.listProjects(req.user.uid));
}

export async function getProject(req, res) {
  res.json(
    await projectsService.getProject(req.validated.params.id, req.user.uid)
  );
}

export async function updateProject(req, res) {
  res.json(
    await projectsService.updateProject({
      id: req.validated.params.id,
      payload: req.validated.body,
      uid: req.user.uid,
    })
  );
}
