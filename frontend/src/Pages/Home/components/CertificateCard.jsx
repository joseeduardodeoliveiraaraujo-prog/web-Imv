import { FaArrowRight } from "react-icons/fa";

const CertificateCard = ({ certificate, onSelect }) => (
  <article className="certificate-item">
    <span className="certificate-name" title={certificate.name}>
      {certificate.name}
    </span>
    <button
      type="button"
      className="certificate-card"
      onClick={() => onSelect(certificate)}
      aria-label={`Abrir modelo ${certificate.name}`}
    >
      <img
        src={certificate.previewUrl}
        alt={certificate.name}
        loading="lazy"
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = "/fallback.png";
        }}
      />
      <span className="certificate-card-hint">
        <FaArrowRight aria-hidden="true" />
      </span>
    </button>
  </article>
);

export default CertificateCard;
