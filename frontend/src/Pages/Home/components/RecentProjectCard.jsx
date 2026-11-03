import { FaCalendarAlt, FaChevronRight, FaRegImage } from "react-icons/fa";

const RecentProjectCard = ({ project, onOpen, onPreload }) => {
  const updatedAt = project.updated_at
    ? new Date(project.updated_at).toLocaleDateString("pt-BR")
    : "—";

  return (
    <button
      type="button"
      className="recente-card"
      onClick={() => onOpen(project.id)}
      onMouseEnter={onPreload}
      onFocus={onPreload}
    >
      <span className="recente-thumb">
        <FaRegImage aria-hidden="true" />
        {project.thumbnail_path && (
          <img
            src={project.thumbnail_path}
            alt=""
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}
      </span>

      <span className="recente-info">
        <span className="recente-title" title={project.title}>
          {project.title}
        </span>
        <span className="recente-meta">
          <FaCalendarAlt aria-hidden="true" />
          {updatedAt}
        </span>
      </span>

      <FaChevronRight className="recente-chevron" aria-hidden="true" />
    </button>
  );
};

export default RecentProjectCard;
