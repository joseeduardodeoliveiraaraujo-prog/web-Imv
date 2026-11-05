import { useRef, useState } from "react";
import { useDialogFocus } from "../../../hooks/useDialogFocus";
import { MAX_PREVIEW_ITEMS } from "../constants/editor";
import { CloseIcon } from "./EditorIcons";
import StylePanel from "./StylePanel";
import TextInputsPanel from "./TextInputsPanel";

const TABS = [
  { id: "conteudo", label: "Conteúdo" },
  { id: "tipografia", label: "Tipografia" },
  { id: "aparencia", label: "Aparência" },
];

const tabId = (id) => `inspector-tab-${id}`;
const panelId = (id) => `inspector-panel-${id}`;

/**
 * Inspector do editor. Em telas largas fica fixo ao lado do canvas;
 * em telas menores (isDrawer) vira uma gaveta modal aberta pelo cabeçalho.
 */
const EditorSidebar = ({ model, itemSelecionado, isDrawer, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("conteudo");
  const sidebarRef = useRef(null);
  const isModal = isDrawer && isOpen;

  useDialogFocus(sidebarRef, { onEscape: onClose, active: isModal });

  const handleTabKeyDown = (event) => {
    const index = TABS.findIndex((tab) => tab.id === activeTab);
    const offsets = { ArrowRight: 1, ArrowLeft: -1 };
    let nextIndex = null;

    if (event.key in offsets) {
      nextIndex = (index + offsets[event.key] + TABS.length) % TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TABS.length - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    const next = TABS[nextIndex].id;
    setActiveTab(next);
    document.getElementById(tabId(next))?.focus();
  };

  return (
    <>
      {isModal && (
        <div className="sidebar-backdrop" onClick={onClose} role="presentation" />
      )}

      <aside
        ref={sidebarRef}
        id="editor-inspector"
        className={`editor-sidebar${isOpen ? " is-open" : ""}`}
        aria-label="Propriedades do certificado"
        role={isModal ? "dialog" : undefined}
        aria-modal={isModal ? "true" : undefined}
        tabIndex={isModal ? -1 : undefined}
        inert={isDrawer && !isOpen ? true : undefined}
      >
        {model.nomesLista.length > MAX_PREVIEW_ITEMS && (
          <div className="limit-warning" role="note">
            Mostrando apenas os primeiros {MAX_PREVIEW_ITEMS} certificados para
            pré-visualização. Todos os {model.nomesValidos.length} serão exportados.
          </div>
        )}

        <div className="inspector-header">
          <div>
            <span className="inspector-label">Inspector</span>
            <p className="inspector-subtitle">Propriedades do certificado</p>
          </div>

          {isDrawer && (
            <button
              type="button"
              className="editor-modal-close"
              onClick={onClose}
              aria-label="Fechar propriedades"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        <div
          className="inspector-tabs"
          role="tablist"
          aria-label="Seções do inspector"
          onKeyDown={handleTabKeyDown}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={tabId(tab.id)}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId(tab.id)}
                tabIndex={isActive ? 0 : -1}
                className={`inspector-tab ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          className="inspector-content"
          role="tabpanel"
          id={panelId(activeTab)}
          aria-labelledby={tabId(activeTab)}
        >
          {activeTab === "conteudo" && <TextInputsPanel model={model} />}
          {activeTab === "tipografia" && (
            <StylePanel itemSelecionado={itemSelecionado} mode="tipografia" model={model} />
          )}
          {activeTab === "aparencia" && (
            <StylePanel itemSelecionado={itemSelecionado} mode="aparencia" model={model} />
          )}
        </div>
      </aside>
    </>
  );
};

export default EditorSidebar;
