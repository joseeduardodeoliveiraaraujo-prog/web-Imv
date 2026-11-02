import { FaPlus } from "react-icons/fa";

const UploadCard = ({ onUpload }) => (
  <article className="certificate-item">
    <span className="certificate-name">Novo modelo</span>
    <button
      type="button"
      className="certificate-card certificate-card--upload"
      onClick={onUpload}
    >
      <span className="certificate-upload-icon">
        <FaPlus aria-hidden="true" />
      </span>
      <span className="certificate-upload-text">Adicionar modelo</span>
      <span className="certificate-upload-hint">PNG ou JPEG</span>
    </button>
  </article>
);

export default UploadCard;
