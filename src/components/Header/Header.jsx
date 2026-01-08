import "./Header.css";

const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-left">
        <h2>Bem-vindo</h2>
        <span>{user.email}</span>
      </div>

      <button className="logout-btn" onClick={onLogout}>
        Sair
      </button>
    </header>
  );
};

export default Header;
