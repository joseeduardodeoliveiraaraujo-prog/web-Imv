import Header from "../components/Header/Header";
import "./Home.css";
import { FaPlus } from "react-icons/fa";
import { useRef } from "react";

const Home = ({ user, onLogout }) => {
  
  const fileInputRef = useRef(null);
  
  const handleUploadClick = () => {
    fileInputRef.current.click();

  }
  return (
    <>
      <Header user={user} onLogout={onLogout} />

      <main className="home-content">
        <h1 className="home-title">Modelo de Certificados</h1>

        <input
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          style={{display:"none"}} 
          onChange={(e) => console.log(e.target.files[0])}
        />
        
        <div className="certificates-grid">
          {/*card de upload*/}
          <div className="certificate-card-upload-card" 
            onClick={handleUploadClick}>
            <FaPlus/>
            <span>Novo modelo</span>
          </div>

          {/*cards de certificados(mock) */}
          <div className="certificate-card">
            <img
              src="https://via.placeholder.com/300x200"
              alt="certificados"
            />
          </div>

          <div className="certificate-card">
            <img
              src="https://via.placeholder.com/300x200"
              alt="Certificados"
            />
          </div>

          <div className="certificate-card">
            <img
              src="https://via.placeholder.com/300x200"
              alt="Certificados"
            />
          </div>

        </div>
      
      </main>
    </>
  );
};

export default Home;
