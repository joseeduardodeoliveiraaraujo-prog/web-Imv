import "./Editor.css";
import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CertificatePreviewList from "./components/CertificatePreviewList";
import EditorSidebar from "./components/EditorSidebar";
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

  if (!certificate) return <p>Carregando certificado...</p>;

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
            {exportState.menuDownloadAberto && (
              <div className="header-download-menu">
                <button className="header-download-item" onClick={exportState.handleDownloadPdf}>
                  <div className="item-text-wrapper">
                    <span className="item-main-title">PDF Único</span>
                    <span className="item-sub-desc">todos-os-certificados.pdf</span>
                  </div>
                </button>
                <button className="header-download-item" onClick={exportState.handleDownloadPdfZip}>
                  <div className="item-text-wrapper">
                    <span className="item-main-title">PDFs Separados</span>
                    <span className="item-sub-desc">certificados-pdf-separados.zip</span>
                  </div>
                </button>
                <button className="header-download-item" onClick={exportState.handleDownloadJpegZip}>
                  <div className="item-text-wrapper">
                    <span className="item-main-title">JPEGs Separados</span>
                    <span className="item-sub-desc">certificados-individuais.zip</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button className="btn-header-exit" onClick={() => navigate("/")} title="Sair">
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

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
        <div className="loading-overlay">
          <div className="loading-modal">
            <h3>{exportState.mensagemStatus}</h3>

            <div className="progress-container">
              <div
                className="progress-bar"
                style={{ width: `${exportState.progresso}%` }}
              ></div>
            </div>

            <span className="progress-percentage">
              {exportState.progresso}%
            </span>
            <p className="warning-text">
              Aguarde, processando certificados...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
