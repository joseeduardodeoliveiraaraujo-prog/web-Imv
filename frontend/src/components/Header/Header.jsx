import "./Header.css";
import { FaPaw, FaSignOutAlt } from "react-icons/fa";

const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-brand">
        <span className="header-brand-mark">
          <FaPaw aria-hidden="true" />
        </span>
        <div className="header-brand-text">
          <span className="header-brand-title">
            Instituto de Medicina Veterinária
          </span>
        </div>
      </div>

      <div className="header-user">
        <div className="header-user-info">
          <span className="header-user-email" title={user.email}>
            {user.email}
          </span>
        </div>

        <button
          className="logout-btn"
          onClick={onLogout}
          title="Sair"
          aria-label="Sair"
        >
          <FaSignOutAlt aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};

export default Header;
