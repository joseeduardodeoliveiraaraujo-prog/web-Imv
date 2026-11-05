import { createElement } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaFileAlt,
  FaLayerGroup,
} from "react-icons/fa";

const metrics = [
  {
    key: "models",
    label: "Modelos Ativos",
    icon: FaFileAlt,
    tone: "emerald",
  },
  {
    key: "projects",
    // O backend guarda só os 5 projetos mais recentes por usuário.
    label: "Projetos Recentes",
    icon: FaLayerGroup,
    tone: "blue",
  },
  {
    key: "lastModified",
    label: "Última Modificação",
    icon: FaClock,
    tone: "amber",
  },
  {
    key: "newThisMonth",
    label: "Novos este Mês",
    icon: FaCalendarAlt,
    tone: "violet",
  },
];

const HomeMetrics = ({ models, projects, lastModified, newThisMonth }) => {
  const values = { models, projects, lastModified, newThisMonth };

  return (
    <section className="home-metrics" aria-label="Resumo dos certificados">
      {metrics.map(({ key, label, icon, tone }) => (
        <article className="metric-card" key={key}>
          <span className={`metric-icon metric-icon--${tone}`}>
            {createElement(icon, { "aria-hidden": true })}
          </span>
          <div className="metric-info">
            <span className="metric-label">{label}</span>
            <span className="metric-value">{values[key]}</span>
          </div>
        </article>
      ))}
    </section>
  );
};

export default HomeMetrics;
