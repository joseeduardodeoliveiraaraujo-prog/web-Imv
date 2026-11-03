import {
  FaArrowRight,
  FaEye,
  FaRegImage,
  FaTrashAlt,
} from "react-icons/fa";

const handleImageError = (event) => {
  event.currentTarget.style.display = "none";
};

const CertificateCard = ({ certificate, onSelect, onDelete, view }) => {
  const { name, previewUrl, createdAt, extension } = certificate;

  if (view === "list") {
    return (
      <article className="certificate-row">
        <button
          type="button"
          className="certificate-row-thumb"
          onClick={() => onSelect(certificate)}
          aria-label={`Abrir modelo ${name}`}
        >
          <FaRegImage aria-hidden="true" />
          <img src={previewUrl} alt="" loading="lazy" onError={handleImageError} />
        </button>

        <div className="certificate-row-info">
          <h3 className="certificate-row-title" title={name}>
            {name}
          </h3>
          <p className="certificate-row-meta">
            Criado em {createdAt} •{" "}
            <span className="certificate-row-tag">{extension}</span>
          </p>
        </div>

        <div className="certificate-row-actions">
          <button
            type="button"
            className="certificate-row-view"
            onClick={() => onSelect(certificate)}
          >
            <FaEye aria-hidden="true" />
            <span>Visualizar</span>
          </button>
          <button
            type="button"
            className="certificate-row-delete"
            onClick={() => onDelete(certificate)}
            title="Excluir"
            aria-label={`Excluir ${name}`}
          >
            <FaTrashAlt aria-hidden="true" />
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="certificate-card">
      <div className="certificate-card-top">
        <span className="certificate-badge">{extension}</span>
        <button
          type="button"
          className="certificate-card-delete"
          onClick={() => onDelete(certificate)}
          title="Excluir"
          aria-label={`Excluir ${name}`}
        >
          <FaTrashAlt aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        className="certificate-thumb"
        onClick={() => onSelect(certificate)}
        aria-label={`Abrir modelo ${name}`}
      >
        <FaRegImage className="certificate-thumb-fallback" aria-hidden="true" />
        <img src={previewUrl} alt="" loading="lazy" onError={handleImageError} />
        <span className="certificate-thumb-overlay">
          <FaEye aria-hidden="true" />
          Visualizar
        </span>
      </button>

      <div className="certificate-card-foot">
        <h3 className="certificate-name" title={name}>
          {name}
        </h3>
        <div className="certificate-card-meta">
          <span>Criado em {createdAt}</span>
          <button
            type="button"
            className="certificate-use"
            onClick={() => onSelect(certificate)}
          >
            Usar modelo
            <FaArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
};

export default CertificateCard;
