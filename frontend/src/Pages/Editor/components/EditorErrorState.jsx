import { useEffect, useRef } from "react";

const EditorErrorState = ({ message, canRetry, onRetry, onBack }) => {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="editor-error" role="alert">
      <div className="editor-error-card">
        <span className="editor-modal-eyebrow">Editor</span>
        <h1 className="editor-error-title" ref={headingRef} tabIndex={-1}>
          Não foi possível abrir
        </h1>
        <p className="editor-error-message">{message}</p>

        <div className="editor-error-actions">
          <button type="button" className="btn-header-glass" onClick={onBack}>
            Voltar para o início
          </button>
          {canRetry && (
            <button type="button" className="btn-header-primary" onClick={onRetry}>
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorErrorState;
