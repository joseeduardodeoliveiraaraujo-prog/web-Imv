import { useEffect, useRef } from "react";
import {
  FaEdit,
  FaRegImage,
  FaTimes,
  FaTrashAlt,
} from "react-icons/fa";

const CertificatePreviewModal = ({
  certificate,
  onClose,
  onEdit,
  onDelete,
}) => {
  const panelRef = useRef(null);
  const titleId = "home-modal-title";

  useEffect(() => {
    panelRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="home-modal-overlay" onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        className="home-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="home-modal-header">
          <div className="home-modal-heading">
            <h2 className="home-modal-title" id={titleId}>
              {certificate.name}
            </h2>
            <p className="home-modal-subtitle">
              {certificate.extension} • Criado em {certificate.createdAt}
            </p>
          </div>
          <button
            type="button"
            className="home-modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <div className="home-modal-body">
          <FaRegImage className="home-modal-fallback" aria-hidden="true" />
          <img
            src={certificate.originalUrl || certificate.previewUrl}
            alt={`Pré-visualização de ${certificate.name}`}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>

        <div className="home-modal-footer">
          <span className="home-modal-format">
            Formato {certificate.extension} • Pré-visualização do modelo
          </span>

          <div className="home-modal-actions">
            <button
              type="button"
              className="home-modal-btn danger"
              onClick={onDelete}
            >
              <FaTrashAlt aria-hidden="true" />
              <span>Excluir</span>
            </button>
            <button
              type="button"
              className="home-modal-btn ghost"
              onClick={onClose}
            >
              Fechar
            </button>
            <button
              type="button"
              className="home-modal-btn primary"
              onClick={onEdit}
            >
              <FaEdit aria-hidden="true" />
              <span>Editar Campos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreviewModal;
