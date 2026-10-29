import DownloadMenu from "./DownloadMenu";
import StylePanel from "./StylePanel";
import TextInputsPanel from "./TextInputsPanel";

const EditorSidebar = ({
  model,
  itemSelecionado,
  exportState,
  onSaveProject,
}) => (
  <aside className="editor-sidebar">
    {model.nomesLista.length > 20 && (
      <div className="limit-warning">
        Mostrando apenas os primeiros 20 certificados para pré-visualização.
      </div>
    )}

    <TextInputsPanel model={model} />
    <StylePanel itemSelecionado={itemSelecionado} model={model} />

    <DownloadMenu
      isOpen={exportState.menuDownloadAberto}
      onToggle={exportState.toggleDownloadMenu}
      onClose={exportState.closeDownloadMenu}
      onDownloadPdf={exportState.handleDownloadPdf}
      onDownloadPdfZip={exportState.handleDownloadPdfZip}
      onDownloadJpegZip={exportState.handleDownloadJpegZip}
    />

    <div className="save-group-container">
      <button className="btn-save" onClick={onSaveProject}>
        <span className="save-icon">💾</span>
        <span>Salvar Projeto</span>
      </button>
    </div>
  </aside>
);

export default EditorSidebar;
