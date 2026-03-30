import Header from "../components/Header/Header";
import "./Home.css";
import { FaPlus } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = ({ user, onLogout }) => {
  //states
  const navigate = useNavigate();
  const [selectedCertificate, setSelectedCertificate] = useState (null);
  const [certificates, setCertificates] = useState([]);
  
  //refs
  const fileInputRef = useRef(null);

  //Effect
  useEffect(() => {
    localStorage.setItem(
      "certificates",
      JSON.stringify(certificates)
    );
  }, [certificates]);
  
  useEffect(() => {
    const saved = localStorage.getItem("certificates");
    if (saved) {
     setCertificates(JSON.parse(saved));
    }
  }, []);

  //handlers funçoes
  const handleUploadClick = () => {
    fileInputRef.current.click();

  }

  const handleFileChange = (e) =>{
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

      setCertificates(prev => [
    ...prev,
    {
      id: crypto.randomUUID(),
      file,
      previewUrl,
      name: file.name.replace(/\.[^/.]+$/, "")
    }
  ]);

    e.target.value = null;

  };

  // Função para limpar o certificado selecionado e fechar o modal
  const closeModal = () => {
    setSelectedCertificate(null);
  };

  const handleEdit = () => {
   if (!selectedCertificate) return;
  closeModal();
  navigate(`/editor/${selectedCertificate.id}`);
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm(
      "tem certeza que deseja apagar este modelo?"
    );

    if (!confirmDelete) return;
    
    setCertificates(prev =>
      prev.filter(cert => cert !== selectedCertificate)
    );

    closeModal();


  };
  //return
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
          <div className="certificate-item">
            <span className="certificate-name">Novo modelo</span>
  
            <div 
            className="certificate-card-upload-card" 
            onClick={handleUploadClick}
            >
            <FaPlus />
             {/* Removi o span daqui de dentro para ele não duplicar */}
            </div>
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
                    onClick={closeModal}
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
              {/* Ações Flutuantes - Substituem o footer */}
              <div className="floating-actions">
                <button className="btn-fab edit" title="Editar" onClick={handleEdit}>
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </button>
                    
                <button className="btn-fab delete" title="Excluir" onClick={handleDelete}>
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
        
          )}

          {certificates.map((cert) => (
            <div className="certificate-item" key={cert.id} >
              <span className="certificate-name" title={cert.name}>
                {cert.name}
              </span>
            
              <div className="certificate-card"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedCertificate(cert)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedCertificate(cert)}
              >
             
                <img
                  src={cert.previewUrl}
                  alt={cert.name}
                />  
             </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
};

export default Home;
