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
        <h1>{certificate.name}</h1>
        <button className="btn-exit" onClick={() => navigate("/")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
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
          <span>Sair</span>
        </button>
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
          exportState={exportState}
          onSaveProject={handleSaveProject}
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
