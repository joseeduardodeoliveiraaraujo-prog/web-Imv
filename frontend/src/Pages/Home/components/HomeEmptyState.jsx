import { FaRegFolderOpen } from "react-icons/fa";

const HomeEmptyState = ({ title, description }) => (
  <div className="home-empty">
    <FaRegFolderOpen className="home-empty-icon" aria-hidden="true" />
    <strong>{title}</strong>
    <p>{description}</p>
  </div>
);

export default HomeEmptyState;
