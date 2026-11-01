import { useState } from "react";
import StylePanel from "./StylePanel";
import TextInputsPanel from "./TextInputsPanel";

const TABS = [
  { id: "conteudo", label: "Conteúdo" },
  { id: "tipografia", label: "Tipografia" },
  { id: "aparencia", label: "Aparência" },
];

const EditorSidebar = ({ model, itemSelecionado }) => {
  const [activeTab, setActiveTab] = useState("conteudo");

  return (
    <aside className="editor-sidebar">
      {model.nomesLista.length > 20 && (
        <div className="limit-warning">
          Mostrando apenas os primeiros 20 certificados para pré-visualização.
        </div>
      )}

      <div className="inspector-header">
        <div>
          <span className="inspector-label">Inspector</span>
          <p className="inspector-subtitle">Propriedades do certificado</p>
        </div>
      </div>

      <div className="inspector-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`inspector-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="inspector-content">
        {activeTab === "conteudo" && <TextInputsPanel model={model} />}
        {activeTab === "tipografia" && <StylePanel itemSelecionado={itemSelecionado} mode="tipografia" model={model} />}
        {activeTab === "aparencia" && <StylePanel itemSelecionado={itemSelecionado} mode="aparencia" model={model} />}
      </div>
    </aside>
  );
};

export default EditorSidebar;
