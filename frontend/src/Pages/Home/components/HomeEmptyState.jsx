import { FaRegFileAlt } from "react-icons/fa";

const HomeEmptyState = ({ title, description, busy = false }) => (
  <div
    className="home-empty"
    role={busy ? "status" : undefined}
    aria-busy={busy || undefined}
  >
    <FaRegFileAlt className="home-empty-icon" aria-hidden="true" />
    <strong>{title}</strong>
    {description && <p>{description}</p>}
  </div>
);

export default HomeEmptyState;
