import { useRef } from "react";
import { useDialogFocus } from "../../../hooks/useDialogFocus";

const ExportLoadingModal = ({ progresso, mensagemStatus, tipoExportacao }) => {
  const modalRef = useRef(null);
  const titleId = "export-loading-title";
  const valor = Math.max(0, Math.min(100, progresso || 0));

  // Sem ação de Esc: a exportação não pode ser interrompida pela metade.
  useDialogFocus(modalRef);

  return (
    <div className="editor-modal-overlay loading-overlay">
      <div
        ref={modalRef}
        className="editor-modal loading-modal"
        role="dialog"
        aria-modal="true"
        aria-busy="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="loading-spinner" aria-hidden="true"></div>

        <span className="editor-modal-eyebrow">Exportando</span>
        <h2 className="editor-modal-title loading-title" id={titleId}>
          {tipoExportacao || "Processando certificados"}
        </h2>

        <p className="loading-status" aria-live="polite">
          {mensagemStatus || "Preparando..."}
        </p>

        <div
          className="loading-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={valor}
          aria-valuetext={`${valor}% - ${mensagemStatus || "Preparando"}`}
        >
          <div
            className="loading-progress-bar"
            style={{ width: `${valor}%` }}
          ></div>
        </div>

        <span className="loading-percentage">{valor}%</span>
        <p className="loading-hint">
          Não feche esta janela enquanto o download não iniciar.
        </p>
      </div>
    </div>
  );
};

export default ExportLoadingModal;
