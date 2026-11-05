import { useRef, useState } from "react";
import { toast } from "../../../components/Toast/toastStore";
import { createProject, updateProject } from "../../../services/projectsApi";
import { filterNamesForSave } from "../utils/names";

const getSaveErrorMessage = (error) => {
  switch (error?.status) {
    case 400:
      return "Não foi possível salvar: confira a lista de nomes, os textos e os tamanhos de fonte.";
    case 404:
      return "Não foi possível salvar: o modelo deste projeto não existe mais.";
    case 429:
      return "Muitas requisições. Aguarde alguns instantes e tente salvar novamente.";
    default:
      return "Não foi possível salvar o projeto. Verifique sua conexão e tente novamente.";
  }
};

export const useSaveProject = ({
  user,
  certificate,
  projectId,
  adoptProject,
  navigate,
  model,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  // Bloqueia cliques repetidos antes mesmo do próximo render.
  const savingRef = useRef(false);

  const handleSaveProject = async () => {
    if (!user || !certificate || savingRef.current) return;

    if (filterNamesForSave(model.nomesLista).length === 0) {
      toast.error("Insira ao menos um nome na lista antes de salvar.");
      return;
    }

    savingRef.current = true;
    setIsSaving(true);

    // Captura o estado salvo agora: edições feitas durante o envio continuam pendentes.
    const savedSnapshot = model.snapshot;

    try {
      const token = await user.getIdToken();
      const payload = model.buildProjectPayload(certificate.id);

      const data = projectId
        ? await updateProject(projectId, payload, token)
        : await createProject(payload, token);

      if (!projectId) {
        adoptProject(data.id);
        navigate(`/project/${data.id}`, { replace: true });
      }

      model.markSaved(savedSnapshot);
      setLastSavedAt(new Date());
      toast.success("Projeto salvo.");
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      toast.error(getSaveErrorMessage(error));
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return {
    handleSaveProject,
    isSaving,
    lastSavedAt,
  };
};
