import { useEffect, useRef } from "react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";

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
          <h2 className="home-modal-title" id={titleId}>
            {certificate.name}
          </h2>
          <button
            type="button"
            className="home-modal-close"
            onClick={onClose}
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

        <div className="home-modal-body">
          <img
            src={certificate.originalUrl || certificate.previewUrl}
            alt={`Pré-visualização de ${certificate.name}`}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/fallback.png";
            }}
          />
        </div>

        <div className="home-modal-footer">
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
            className="home-modal-btn primary"
            onClick={onEdit}
          >
            <FaEdit aria-hidden="true" />
            <span>Editar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreviewModal;
