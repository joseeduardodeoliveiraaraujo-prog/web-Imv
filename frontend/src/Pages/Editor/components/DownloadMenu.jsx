const DownloadMenu = ({
  isOpen,
  onToggle,
  onClose,
  onDownloadPdf,
  onDownloadPdfZip,
  onDownloadJpegZip,
}) => (
  <div className="download-group-container">
    {isOpen && (
      <div className="download-options-menu">
        <button
          className="option-item"
          onClick={() => {
            onDownloadPdf();
            onClose();
          }}
        >
          <div className="item-text-wrapper">
            <strong className="item-main-title">PDF Único</strong>
            <span className="item-sub-desc">
              Todos os certificados em um só arquivo
            </span>
          </div>
        </button>

        <button
          className="option-item"
          onClick={() => {
            onDownloadPdfZip();
            onClose();
          }}
        >
          <div className="item-text-wrapper">
            <strong className="item-main-title">PDFs Individuais (.ZIP)</strong>
            <span className="item-sub-desc">
              Cada certificado em seu próprio PDF
            </span>
          </div>
        </button>

        <button
          className="option-item"
          onClick={() => {
            onDownloadJpegZip();
            onClose();
          }}
        >
          <div className="item-text-wrapper">
            <strong className="item-main-title">Imagens JPEG (.ZIP)</strong>
            <span className="item-sub-desc">
              Fotos individuais de cada certificado
            </span>
          </div>
        </button>
      </div>
    )}

    <button className="btn-download-trigger" onClick={onToggle}>
      <span>Baixar Certificados</span>
      <span className={`chevron ${isOpen ? "up" : "down"}`}></span>
    </button>
  </div>
);

export default DownloadMenu;
