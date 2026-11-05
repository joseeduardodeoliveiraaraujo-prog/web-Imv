import "./Editor.css";
import { useEffect, useEffectEvent, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { confirmDialog } from "../../components/ConfirmDialog/confirmStore";
import PageLoader from "../../components/PageLoader/PageLoader";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import CertificatePreviewList from "./components/CertificatePreviewList";
import EditorErrorState from "./components/EditorErrorState";
import {
  BackIcon,
  DownloadIcon,
  SaveIcon,
  SlidersIcon,
} from "./components/EditorIcons";
import EditorSidebar from "./components/EditorSidebar";
import ExportLoadingModal from "./components/ExportLoadingModal";
import ExportModal from "./components/ExportModal";
import SaveStatus from "./components/SaveStatus";
import { useCanvasInteraction } from "./hooks/useCanvasInteraction";
import { useCertificateData } from "./hooks/useCertificateData";
import { useCertificateExport } from "./hooks/useCertificateExport";
import { useEditorModel } from "./hooks/useEditorModel";
import { useSaveProject } from "./hooks/useSaveProject";
import { loadEditorFonts } from "./utils/loadEditorFonts";

// Mesmo breakpoint em que o CSS transforma o inspector em gaveta.
const DRAWER_QUERY = "(max-width: 1080px)";

const Editor = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isProjectRoute = location.pathname.startsWith("/project/");
  const isDrawer = useMediaQuery(DRAWER_QUERY);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadEditorFonts();
  }, []);

  const model = useEditorModel();
  const { certificate, projectId, adoptProject, error, retry } =
    useCertificateData({
      id,
      isProjectRoute,
      onProjectLoaded: model.applyProject,
    });

  const interaction = useCanvasInteraction({
    setPosicaoNome: model.setPosicaoNome,
    setPosicaoCorpo: model.setPosicaoCorpo,
  });

  const exportState = useCertificateExport({ certificate, model });

  const { handleSaveProject, isSaving, lastSavedAt } = useSaveProject({
    user,
    certificate,
    projectId,
    adoptProject,
    navigate,
    model,
  });

  const { isDirty } = model;

  // Aviso do navegador ao fechar/recarregar a aba com alterações pendentes.
  useEffect(() => {
    if (!isDirty) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleShortcut = useEffectEvent((event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      handleSaveProject();
    }
  });

  useEffect(() => {
    const listener = (event) => handleShortcut(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const handleBack = async () => {
    if (isDirty) {
      const leave = await confirmDialog({
        title: "Sair sem salvar?",
        message:
          "Há alterações que ainda não foram salvas neste projeto. Se sair agora, elas serão perdidas.",
        confirmLabel: "Sair sem salvar",
        cancelLabel: "Continuar editando",
        tone: "danger",
      });

      if (!leave) return;
    }

    navigate("/");
  };

  if (error) {
    return (
      <EditorErrorState
        message={error.message}
        canRetry={error.status !== 404}
        onRetry={retry}
        onBack={() => navigate("/")}
      />
    );
  }

  if (!certificate) {
    return <PageLoader message="Carregando certificado..." />;
  }

  return (
    <div className="editor">
      <header className="editor-header">
        <div className="editor-header-left">
          <button
            type="button"
            className="btn-header-back"
            onClick={handleBack}
            title="Voltar"
            aria-label="Voltar para o início"
          >
            <BackIcon />
          </button>
          <div className="editor-header-title-group">
            <span className="editor-header-label">Projeto</span>
            <h1 className="editor-header-title">{certificate.name}</h1>
          </div>
        </div>

        <div className="editor-header-actions">
          <SaveStatus
            isSaving={isSaving}
            isDirty={isDirty}
            lastSavedAt={lastSavedAt}
            isSavedProject={projectId !== null}
          />

          <button
            type="button"
            className="btn-header-glass"
            onClick={handleSaveProject}
            disabled={isSaving}
            aria-label={isSaving ? "Salvando projeto" : "Salvar projeto"}
            title="Salvar projeto (Ctrl+S)"
          >
            <SaveIcon />
            <span className="btn-label">
              {isSaving ? "Salvando..." : "Salvar Projeto"}
            </span>
          </button>

          <button
            type="button"
            className="btn-header-primary"
            onClick={exportState.toggleDownloadMenu}
            aria-expanded={exportState.menuDownloadAberto}
            aria-haspopup="dialog"
            aria-label="Exportar certificados"
            disabled={exportState.estaGerando}
          >
            <DownloadIcon />
            <span className="btn-label">Exportar</span>
            <span
              className={`chevron ${exportState.menuDownloadAberto ? "up" : "down"}`}
              aria-hidden="true"
            ></span>
          </button>

          {isDrawer && (
            <button
              type="button"
              className="btn-header-glass sidebar-toggle"
              onClick={() => setIsSidebarOpen(true)}
              aria-expanded={isSidebarOpen}
              aria-controls="editor-inspector"
              aria-label="Abrir propriedades"
            >
              <SlidersIcon />
              <span className="btn-label">Propriedades</span>
            </button>
          )}
        </div>
      </header>

      {exportState.menuDownloadAberto && (
        <ExportModal
          total={model.nomesValidos.length}
          onClose={exportState.closeDownloadMenu}
          onSelect={exportState.handleExport}
        />
      )}

      <div className="editor-container">
        <main className="editor-workspace bulk-scroll">
          <CertificatePreviewList
            certificate={certificate}
            model={model}
            interaction={interaction}
          />
        </main>

        <EditorSidebar
          model={model}
          itemSelecionado={interaction.itemSelecionado}
          isDrawer={isDrawer}
          isOpen={!isDrawer || isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {exportState.estaGerando && (
        <ExportLoadingModal
          progresso={exportState.progresso}
          mensagemStatus={exportState.mensagemStatus}
          tipoExportacao={exportState.tipoExportacao}
        />
      )}
    </div>
  );
};

export default Editor;
