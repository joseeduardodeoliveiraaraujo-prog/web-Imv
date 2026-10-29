import { createProject, updateProject } from "../../../services/projectsApi";
import { filterNamesForSave } from "../utils/names";

export const useSaveProject = ({
  user,
  certificate,
  projectId,
  setProjectId,
  model,
}) => {
  const handleSaveProject = async () => {
    if (!user || !certificate) return;

    const nomesParaSalvar = filterNamesForSave(model.nomesLista);

    if (nomesParaSalvar.length === 0) {
      alert("Insira nomes na lista!");
      return;
    }

    try {
      const token = await user.getIdToken();
      const payload = model.buildProjectPayload(certificate.id);

      console.log("Payload enviado:", payload);

      const data = projectId
        ? await updateProject(projectId, payload, token)
        : await createProject(payload, token);

      if (!projectId) {
        setProjectId(data.id);
      }

      alert("Projeto salvo com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar projeto");
    }
  };

  return {
    handleSaveProject,
  };
};
