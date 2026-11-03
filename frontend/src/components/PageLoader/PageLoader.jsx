import "./PageLoader.css";

const PageLoader = ({ message = "Carregando..." }) => (
  <div className="page-loader" role="status" aria-live="polite">
    <span className="page-loader-spinner" aria-hidden="true" />
    <p className="page-loader-message">{message}</p>
  </div>
);

export default PageLoader;
