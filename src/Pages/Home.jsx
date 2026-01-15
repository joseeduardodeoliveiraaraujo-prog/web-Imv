import Header from "../components/Header/Header";
import "./Home.css";
import { FaPlus } from "react-icons/fa";
import { useState, useRef } from "react";

const Home = ({ user, onLogout }) => {

  const [selectedCertificate, setSelectedCertificate] = useState (null);

  const [certificates, setCertificates] = useState([]);
  
  const fileInputRef = useRef(null);
  
  const handleUploadClick = () => {
    fileInputRef.current.click();

  }

  const handleFileChange = (e) =>{
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    console.log("Arquivo:", file);

  setCertificates(prev => [...prev, { file, previewUrl }]);

  };



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
          onChange={handleFileChange}
        />

        <div className="certificates-grid">
          {/*card de upload*/}
          <div className="certificate-card-upload-card" 
            onClick={handleUploadClick}>
            <FaPlus/>
            <span>Novo modelo</span>
          </div>

          {selectedCertificate && (
            <div className="modal-overlay">
              <div className="modal-content">

                {/* Header do modal */}
                <div className="modal-header">
                  <span className="modal-title">
                    {selectedCertificate.file.name}
                  </span>

                  <button
                    className="modal-close"
                    onClick={() => setSelectedCertificate(null)}
                  >
                    ✕
                  </button>
                </div>

                {/* Imagem ampliada */}
                <div className="modal-body">
                  <img
                    src={selectedCertificate.previewUrl}
                    alt="Preview do certificado"
                  />
                </div>

               </div>
            </div>
          )}


          {certificates.map((cert,index) => (
            <div className="certificate-card" key={index} onClick={() =>  setSelectedCertificate(cert)}>
             <img
               src={cert.previewUrl}
               alt={cert.file.name}
              />
            </div>
          ))}

          

        </div>
      
      </main>
    </>
  );
};

export default Home;
