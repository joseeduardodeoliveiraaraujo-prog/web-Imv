import Header from "../components/Header/Header";
import "./Home.css";

const Home = ({ user, onLogout }) => {
  return (
    <>
      <Header user={user} onLogout={onLogout} />

      <main className="home-content">
        <h1>Conteúdo da página</h1>
        <p>Aqui fica o restante do site</p>
      </main>
    </>
  );
};

export default Home;
