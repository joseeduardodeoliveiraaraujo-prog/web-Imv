import { useCallback, useEffect, useState } from "react";
import { listCertificates } from "../../../services/certificatesApi";
import { listProjects } from "../../../services/projectsApi";
import {
  ensureUserSynced,
  getSyncErrorMessage,
} from "../../../services/usersApi";
import { formatCertificate, getRequestErrorMessage } from "../utils/homeFormatters";

const LOAD_ERROR =
  "Não foi possível carregar os modelos. Verifique a conexão e tente novamente.";

/**
 * Carrega modelos e projetos recentes em paralelo, sem bloquear a renderização
 * pela sincronização do usuário. Se o usuário ainda não existir no banco (404),
 * espera a sincronização terminar e tenta de novo uma vez.
 */
export const useHomeData = (user) => {
  const [certificates, setCertificates] = useState([]);
  const [recentes, setRecentes] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return undefined;

    let isActive = true;

    const carregarDados = async () => {
      try {
        const token = await user.getIdToken();
        let syncError = null;
        const syncPromise = ensureUserSynced(user, token).catch((error) => {
          console.error("Erro ao salvar usuário:", error);
          syncError = error;
        });

        const fetchData = () =>
          Promise.allSettled([listCertificates(token), listProjects(token)]);

        let results = await fetchData();

        const needsRetry = results.some(
          (result) => result.status === "rejected" && result.reason?.status === 404
        );

        if (needsRetry) {
          await syncPromise;
          results = await fetchData();
        }

        if (!isActive) return;

        const [certificatesResult, projectsResult] = results;

        if (certificatesResult.status === "fulfilled") {
          setCertificates(certificatesResult.value.map(formatCertificate));
          setLoadError("");
        } else {
          console.error("Erro ao carregar certificados:", certificatesResult.reason);
          setLoadError(
            getSyncErrorMessage(syncError) ??
              getRequestErrorMessage(certificatesResult.reason, LOAD_ERROR)
          );
        }

        if (projectsResult.status === "fulfilled") {
          setRecentes(projectsResult.value);
        } else {
          console.error("Erro ao carregar projetos:", projectsResult.reason);
        }
      } catch (error) {
        if (isActive) {
          console.error("Erro ao carregar dados:", error);
          setLoadError(getRequestErrorMessage(error, LOAD_ERROR));
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    carregarDados();

    return () => {
      isActive = false;
    };
  }, [user, reloadKey]);

  const reload = useCallback(() => {
    setLoadError("");
    setIsLoading(true);
    setReloadKey((value) => value + 1);
  }, []);

  const addCertificate = useCallback((certificate) => {
    setCertificates((prev) => [certificate, ...prev]);
  }, []);

  // Excluir um modelo remove em cascata os projetos que o usam (backend).
  const removeCertificate = useCallback((certificateId) => {
    setCertificates((prev) => prev.filter((item) => item.id !== certificateId));
    setRecentes((prev) =>
      prev.filter((project) => project.certificate_id !== certificateId)
    );
  }, []);

  return {
    certificates,
    recentes,
    loadError,
    isLoading,
    reload,
    addCertificate,
    removeCertificate,
  };
};
