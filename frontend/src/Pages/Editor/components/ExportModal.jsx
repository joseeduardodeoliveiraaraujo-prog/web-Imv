import { useRef } from "react";
import { useDialogFocus } from "../../../hooks/useDialogFocus";
import { ArchiveIcon, CloseIcon, ImageIcon, PdfIcon } from "./EditorIcons";

const OPTIONS = [
  {
    key: "pdf",
    Icon: PdfIcon,
    title: "PDF Único",
    description: "Todos os certificados em um só arquivo",
  },
  {
    key: "pdfZip",
    Icon: ArchiveIcon,
    title: "PDFs Separados (.ZIP)",
    description: "Cada certificado em seu próprio PDF",
  },
  {
    key: "jpegZip",
    Icon: ImageIcon,
    title: "Imagens JPEG (.ZIP)",
    description: "Fotos individuais de cada certificado",
  },
];

const ExportModal = ({ onClose, onSelect, total }) => {
  const panelRef = useRef(null);

  useDialogFocus(panelRef, { onEscape: onClose });

  return (
    <div className="editor-modal-overlay" onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        className="editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        aria-describedby="export-modal-summary"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="editor-modal-header">
          <div>
            <span className="editor-modal-eyebrow">Exportar</span>
            <h2 className="editor-modal-title" id="export-modal-title">
              Baixar certificados
            </h2>
            <p className="editor-modal-summary" id="export-modal-summary">
              {total === 1
                ? "1 certificado será gerado."
                : `${total} certificados serão gerados.`}
            </p>
          </div>
          <button
            type="button"
            className="editor-modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="export-modal-options">
          {OPTIONS.map((option, index) => {
            const OptionIcon = option.Icon;

            return (
              <button
                key={option.key}
                type="button"
                className="export-option"
                onClick={() => onSelect(option.key)}
                data-autofocus={index === 0 ? true : undefined}
              >
                <span className="export-option-icon">
                  <OptionIcon />
                </span>
                <span className="export-option-text">
                  <strong className="export-option-title">{option.title}</strong>
                  <span className="export-option-desc">{option.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
