import "./Header.css";
import { FaSignOutAlt } from "react-icons/fa";

const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-left">
        <h2>Bem-vindo</h2>
        <span>{user.email}</span>
      </div>

      <button className="logout-btn" onClick={onLogout} title="Sair">
        <FaSignOutAlt />
      </button>


    </header>
  );
};

export default Header;
