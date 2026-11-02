import { FaChevronRight } from "react-icons/fa";

const RecentProjectCard = ({ project, onOpen }) => {
  const updatedAt = new Date(project.updated_at).toLocaleDateString("pt-BR");

  return (
    <button
      type="button"
      className="recente-card"
      onClick={() => onOpen(project.id)}
    >
      <img src={project.thumbnail_path} alt="" />

      <span className="recente-info">
        <span className="recente-title" title={project.title}>
          {project.title}
        </span>
        <span className="recente-meta">{updatedAt}</span>
      </span>

      <FaChevronRight className="recente-chevron" aria-hidden="true" />
    </button>
  );
};

export default RecentProjectCard;
