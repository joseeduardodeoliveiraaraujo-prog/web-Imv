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
  const [recentes, setRecentes] = useState([]);
  
  //refs
  const fileInputRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;

  //Effect
  useEffect(() => {
    if (!user) return;
    loadCertificates();
  }, [user]);

  useEffect(() => {
  setRecentes([
    {
      id: 1,
      nomeProjeto: "Certificado Evento X",
      preview: "https://via.placeholder.com/150",
      data: "10/05/2024",
      autor: "oliveira"
    },
    {
      id: 2,
      nomeProjeto: "Workshop React",
      preview: "https://via.placeholder.com/150",
      data: "09/05/2024",
      autor: "oliveira"
    }
  ]);
}, []);

  const loadCertificates = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();

      const res = await fetch(`${API_URL}/certificates`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Erro ao carregar certificados");
      }

      const data = await res.json();

      // adapta os dados para o formato do seu frontend
      const formatted = data.map(cert => ({
        id: cert.id,
        name: cert.title,
        previewUrl: cert.thumbnail_path,
        originalUrl: cert.image_path // teste1
      }));

      setCertificates(formatted);

    } catch (error) {
      console.error("Erro ao carregar certificados:", error);
    }
  };

  //handlers funçoes
  const handleUploadClick = () => {
    fileInputRef.current.click();

  }
  //1 teste
  const handleFileChange = async (e) => {
    if (!user) return;
  const file = e.target.files[0];
  if (!file) return;

    try {
      const token = await user.getIdToken();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);

      const response = await fetch(`${API_URL}/certificates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Erro no upload");
      }

      const newCert = await response.json(); // reutilização

      setCertificates(prev => [
        {
          id: newCert.id,
          name: newCert.title,
          previewUrl: newCert.thumbnail_path,
          originalUrl: newCert.image_path
        },
        ...prev
      ]);

      e.target.value = ""; // permite enviar o mesmo arquivo novamente

    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
    }
  };

  const handleAbrirProjeto = (id) => {
    navigate(`/editor/${id}`);
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

  const handleDelete = async () => {
    if (!user) return;
    const confirmDelete = window.confirm(
      "tem certeza que deseja apagar este modelo?"
    );

    if (!confirmDelete) return;

    try {
      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}/certificates/${selectedCertificate.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar");
      }

      await loadCertificates();

      closeModal();

    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
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
                    {selectedCertificate.name}
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
                    src={selectedCertificate.originalUrl || selectedCertificate.previewUrl} // teste1
                    alt="Preview do certificado"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/fallback.png";
                    }}
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
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/fallback.png";
                  }}
                />  
             </div>
            </div>
          ))}
        </div>

        <div className="recentes-container">
          <h2>EDITADOS RECENTEMENTE</h2>

          <div className="recentes-lista">
            {recentes.map((item) => (
              <div 
                key={item.id} 
                className="recente-card"
                onClick={() => handleAbrirProjeto(item.id)}
              >
                <img src={item.preview} alt="preview" />

                <div>
                  <h3>{item.nomeProjeto}</h3>
                  <p>Última edição: {item.data}</p>
                  <span>by {item.autor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </main>
    </>
  );
};

export default Home;
