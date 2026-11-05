import { useCallback, useEffect, useRef, useState } from "react";
import { auth } from "../../../services/firebase";
import { getCertificate } from "../../../services/certificatesApi";
import { getProject } from "../../../services/projectsApi";

const routeKey = (isProjectRoute, id) =>
  `${isProjectRoute ? "project" : "editor"}:${id}`;

export const getLoadErrorMessage = (error, isProjectRoute) => {
  if (error?.code === "no-session") {
    return "Sua sessão expirou. Entre novamente para continuar.";
  }

  if (error?.status === 404) {
    return isProjectRoute
      ? "Este projeto não existe mais ou você não tem acesso a ele."
      : "Este modelo não existe mais ou você não tem acesso a ele.";
  }

  if (error?.status === 429) {
    return "Muitas requisições. Aguarde alguns instantes e tente novamente.";
  }

  return "Não foi possível carregar. Verifique sua conexão e tente novamente.";
};

export const useCertificateData = ({ id, isProjectRoute, onProjectLoaded }) => {
  const [certificate, setCertificate] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedRouteRef = useRef(null);

  useEffect(() => {
    if (!id) return undefined;

    const key = routeKey(isProjectRoute, id);
    if (loadedRouteRef.current === key) return undefined;

    let isActive = true;

    const loadData = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();

        if (!token) {
          throw Object.assign(new Error("Sem sessão"), { code: "no-session" });
        }

        if (isProjectRoute) {
          const data = await getProject(id, token);
          if (!isActive) return;

          setProjectId(data.id);
          setCertificate({
            id: data.certificate_id,
            name: data.title,
            previewUrl: data.image_path,
          });
          onProjectLoaded(data);
        } else {
          const data = await getCertificate(id, token);
          if (!isActive) return;

          setCertificate({
            ...data,
            name: data.title,
            previewUrl: data.image_path,
          });
        }

        loadedRouteRef.current = key;
        setError(null);
      } catch (loadError) {
        if (!isActive) return;

        console.error("Erro ao carregar editor:", loadError);
        setError({
          status: loadError?.status,
          message: getLoadErrorMessage(loadError, isProjectRoute),
        });
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, [id, isProjectRoute, onProjectLoaded, reloadKey]);

  /**
   * Após o primeiro salvamento a rota muda de /editor/:id para /project/:id.
   * Marca a nova rota como já carregada para não refazer a busca nem
   * sobrescrever edições feitas enquanto o projeto era salvo.
   */
  const adoptProject = useCallback((newProjectId) => {
    loadedRouteRef.current = routeKey(true, String(newProjectId));
    setProjectId(newProjectId);
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  return {
    certificate,
    projectId,
    adoptProject,
    error,
    retry,
  };
};
