import "./Editor.css";
import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageLoader from "../../components/PageLoader/PageLoader";
import CertificatePreviewList from "./components/CertificatePreviewList";
import EditorSidebar from "./components/EditorSidebar";
import ExportLoadingModal from "./components/ExportLoadingModal";
import { useCanvasInteraction } from "./hooks/useCanvasInteraction";
import { useCertificateData } from "./hooks/useCertificateData";
import { useCertificateExport } from "./hooks/useCertificateExport";
import { useEditorModel } from "./hooks/useEditorModel";
import { useSaveProject } from "./hooks/useSaveProject";
import { loadEditorFonts } from "./utils/loadEditorFonts";

const Editor = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isProjectRoute = location.pathname.startsWith("/project/");

  useEffect(() => {
    loadEditorFonts();
  }, []);

  const model = useEditorModel();
  const { certificate, projectId, setProjectId } = useCertificateData({
    id,
    isProjectRoute,
    navigate,
    onProjectLoaded: model.applyProject,
  });

  const interaction = useCanvasInteraction({
    indexEditando: model.indexEditando,
    nomesLista: model.nomesLista,
    textoCorpoBase: model.textoCorpoBase,
    tamanhoNome: model.tamanhoNome,
    fonteNome: model.fonteNome,
    tamanhoCorpo: model.tamanhoCorpo,
    fonteCorpo: model.fonteCorpo,
    posicaoNome: model.posicaoNome,
    posicaoCorpo: model.posicaoCorpo,
    setPosicaoNome: model.setPosicaoNome,
    setPosicaoCorpo: model.setPosicaoCorpo,
    getCachedTextBox: model.getCachedTextBox,
  });

  const exportState = useCertificateExport({ certificate, model });

  const { handleSaveProject } = useSaveProject({
    user,
    certificate,
    projectId,
    setProjectId,
    model,
  });

  if (!certificate) {
    return <PageLoader message="Carregando certificado..." />;
  }

  return (
    <div className="editor">
      <header className="editor-header">
        <div className="editor-header-left">
          <button className="btn-header-back" onClick={() => navigate("/")} title="Voltar">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div className="editor-header-title-group">
            <span className="editor-header-label">Projeto</span>
            <h1 className="editor-header-title">{certificate.name}</h1>
          </div>
        </div>

        <div className="editor-header-actions">
          <button className="btn-header-glass" onClick={handleSaveProject}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>Salvar Projeto</span>
          </button>

          <div className="header-download-wrapper">
            <button
              className="btn-header-primary"
              onClick={exportState.toggleDownloadMenu}
              aria-expanded={exportState.menuDownloadAberto}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Exportar</span>
              <span className={`chevron ${exportState.menuDownloadAberto ? "up" : "down"}`}></span>
            </button>
          </div>
        </div>
      </header>

      {exportState.menuDownloadAberto && (
        <div
          className="editor-modal-overlay"
          onClick={exportState.closeDownloadMenu}
          role="presentation"
        >
          <div
            className="editor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="editor-modal-header">
              <div>
                <span className="editor-modal-eyebrow">Exportar</span>
                <h2 className="editor-modal-title" id="export-modal-title">
                  Baixar certificados
                </h2>
              </div>
              <button
                className="editor-modal-close"
                onClick={exportState.closeDownloadMenu}
                aria-label="Fechar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="export-modal-options">
              <button
                className="export-option"
                onClick={() => {
                  exportState.closeDownloadMenu();
                  exportState.handleDownloadPdf();
                }}
              >
                <span className="export-option-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="8" y1="13" x2="16" y2="13"></line>
                    <line x1="8" y1="17" x2="13" y2="17"></line>
                  </svg>
                </span>
                <span className="export-option-text">
                  <strong className="export-option-title">PDF Único</strong>
                  <span className="export-option-desc">
                    Todos os certificados em um só arquivo
                  </span>
                </span>
              </button>

              <button
                className="export-option"
                onClick={() => {
                  exportState.closeDownloadMenu();
                  exportState.handleDownloadPdfZip();
                }}
              >
                <span className="export-option-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 8v13H3V8"></path>
                    <path d="M1 3h22v5H1z"></path>
                    <path d="M10 12h4"></path>
                  </svg>
                </span>
                <span className="export-option-text">
                  <strong className="export-option-title">PDFs Separados (.ZIP)</strong>
                  <span className="export-option-desc">
                    Cada certificado em seu próprio PDF
                  </span>
                </span>
              </button>

              <button
                className="export-option"
                onClick={() => {
                  exportState.closeDownloadMenu();
                  exportState.handleDownloadJpegZip();
                }}
              >
                <span className="export-option-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </span>
                <span className="export-option-text">
                  <strong className="export-option-title">Imagens JPEG (.ZIP)</strong>
                  <span className="export-option-desc">
                    Fotos individuais de cada certificado
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
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
