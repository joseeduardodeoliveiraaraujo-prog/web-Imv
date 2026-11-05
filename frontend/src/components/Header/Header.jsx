import "./Header.css";
import {
  FaAward,
  FaPlus,
  FaSearch,
  FaSignOutAlt,
} from "react-icons/fa";

const Header = ({
  user,
  onLogout,
  onNewModel,
  searchValue = "",
  onSearchChange,
}) => {
  const identifier = user?.email || "Usuário";
  const initials = identifier.slice(0, 2).toUpperCase();

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="header-brand-mark">
            <FaAward aria-hidden="true" />
          </span>
          <div className="header-brand-text">
            <span className="header-brand-title">
              Instituto de Medicina Veterinária
            </span>
            <span className="header-brand-subtitle">
              Gerenciador de Certificados
            </span>
          </div>
        </div>

        <label className="header-search">
          <FaSearch aria-hidden="true" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Buscar por modelo..."
            aria-label="Buscar modelos de certificado"
          />
        </label>

        <div className="header-actions">
          <button
            type="button"
            className="header-new-btn"
            onClick={onNewModel}
          >
            <FaPlus aria-hidden="true" />
            <span>Novo Modelo</span>
          </button>

          <span className="header-divider" aria-hidden="true" />

          <div className="header-user">
            <div className="header-avatar" aria-hidden="true">
              {initials}
              <span className="header-status" />
            </div>

            <div className="header-user-info">
              <span className="header-user-email" title={user?.email}>
                {user?.email}
              </span>
              <span className="header-user-role">Administrador</span>
            </div>

            <button
              type="button"
              className="logout-btn"
              onClick={onLogout}
              title="Sair"
              aria-label="Sair"
            >
              <FaSignOutAlt aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
