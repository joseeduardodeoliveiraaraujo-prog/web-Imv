import { FaSpinner, FaUpload } from "react-icons/fa";

const UploadCard = ({
  onUpload,
  onDrop,
  onDragOver,
  onDragLeave,
  isDragging,
  isUploading,
  error,
}) => (
  <div className="upload-area">
    <button
      type="button"
      className={`upload-dropzone${isDragging ? " is-dragging" : ""}`}
      onClick={onUpload}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      disabled={isUploading}
    >
      <span className="upload-icon">
        {isUploading ? (
          <FaSpinner className="spin" aria-hidden="true" />
        ) : (
          <FaUpload aria-hidden="true" />
        )}
      </span>
      <span className="upload-title">
        {isUploading ? (
          "Enviando modelo..."
        ) : (
          <>
            Arraste um novo modelo PNG/JPEG ou{" "}
            <span className="upload-link">clique para selecionar</span>
          </>
        )}
      </span>
      <span className="upload-hint">
        Tamanho máximo: 5 MB • Resolução recomendada: 2000 x 1414
      </span>
    </button>
    {error && (
      <p className="upload-error" role="alert">
        {error}
      </p>
    )}
  </div>
);

export default UploadCard;
