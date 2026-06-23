import Header from "../components/Header/Header";
import "./Home.css";
import { FaPlus } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * COMPONENT: Home
 * RESPONSIBILITY: Gerenciar a dashboard de modelos de certificados, uploads de mídia,
 * abertura de modais e listagem de projetos editados recentemente.
 */
const Home = ({ user, onLogout }) => {
  // ==========================================
  // STATES (ESTADOS DA APLICAÇÃO)
  // ==========================================
  const navigate = useNavigate();
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [recentes, setRecentes] = useState([]);
  
  // ==========================================
  // REFS & ENVIRONMENT VARIABLES
  // ==========================================
  const fileInputRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // ==========================================
  // SIDE EFFECTS (EFEITOS COLATERAIS)
  // ==========================================

  /**
   * EFFECT: Sincronização inicial de carregamento de modelos de certificados.
   * TRIGGER: Disparado assim que a sessão do usuário é validada pelo provedor de autenticação.
   */
  useEffect(() => {
    if (!user) return;
    loadCertificates();
  }, [user]);

  /**
   * EFFECT: Carregamento assíncrono do histórico de projetos modificados recentemente.
   * TRIGGER: Executado de forma paralela ao fluxo principal mediante validação do Bearer Token.
   */
  useEffect(() => {
    const carregarRecentes = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch(`${API_URL}/projects`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar projetos");
        }

        const data = await response.json();
        setRecentes(data);

      } catch (err) {
        console.error(err);
      }
    };

    carregarRecentes();
  }, [user]);

  // ==========================================
  // DATA FETCHING FUNCTIONS (REQUISIÇÕES)
  // ==========================================

  /**
   * FUNCTION: loadCertificates
   * DESCRIPTION: Consome o endpoint de certificados e normaliza o schema de dados vindo da API para o frontend.
   */
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

      // Normalização de chaves para compatibilidade com o formato do frontend
      const formatted = data.map(cert => ({
        id: cert.id,
        name: cert.title,
        previewUrl: cert.thumbnail_path,
        originalUrl: cert.image_path
      }));

      setCertificates(formatted);

    } catch (error) {
      console.error("Erro ao carregar certificados:", error);
    }
  };

  // ==========================================
  // HANDLERS (EVENTOS E INTERAÇÕES)
  // ==========================================

  /**
   * EVENT: handleUploadClick
   * DESCRIPTION: Simula um evento de clique no input de arquivo oculto via referência do DOM.
   */
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  /**
   * EVENT: handleFileChange
   * DESCRIPTION: Captura a alteração do input binário, gera uma instância FormData e submete ao endpoint via POST.
   */
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

      const newCert = await response.json();

      setCertificates(prev => [
        {
          id: newCert.id,
          name: newCert.title,
          previewUrl: newCert.thumbnail_path,
          originalUrl: newCert.image_path
        },
        ...prev
      ]);

      // Reseta o valor do elemento nativo para permitir novos uploads redundantes do mesmo arquivo
      e.target.value = "";

    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
    }
  };

  /**
   * EVENT: handleAbrirProjeto
   * DESCRIPTION: Redireciona a pilha do roteador interno do React Router diretamente para a rota do projeto ID.
   */
  const handleAbrirProjeto = (id) => {
    navigate(`/project/${id}`);
  };

  /**
   * EVENT: closeModal
   * DESCRIPTION: Esvazia o estado de contexto do certificado selecionado, desmontando o nó do modal overlay.
   */
  const closeModal = () => {
    setSelectedCertificate(null);
  };

  /**
   * EVENT: handleEdit
   * DESCRIPTION: Interrompe o escopo do modal e despacha o usuário para o editor de certificados indexado.
   */
  const handleEdit = () => {
    if (!selectedCertificate) return;
    closeModal();
    navigate(`/editor/${selectedCertificate.id}`);
  };

  /**
   * EVENT: handleDelete
   * DESCRIPTION: Solicita confirmação nativa do navegador e executa o disparo destrutivo via método HTTP DELETE.
   */
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

  // ==========================================
  // RENDER INTERFACE (JSX DOM STRUCTURE)
  // ==========================================
  return (
    <>
      <Header user={user} onLogout={onLogout} />

      <div className="home-wrapper">
        <main className="home-content">
          <h1 className="home-title">Modelo de Certificados</h1>

          {/* Input Oculto de Gerenciamento do Arquivo Local */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <div className="certificates-grid">
            {/* Bloco Inicial Estático: Inserção de Novo Modelo */}
            <div className="certificate-item">
              <span className="certificate-name">Novo modelo</span>
              <div className="certificate-card-upload-card" onClick={handleUploadClick}>
                <FaPlus />
              </div>
            </div>

            {/* Renderização Condicional: Modal de Preview e Painel FAB Suspenso */}
            {selectedCertificate && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <span className="modal-title">{selectedCertificate.name}</span>
                    <button className="modal-close" onClick={closeModal}>✕</button>
                  </div>
                  <div className="modal-body">
                    <img
                      src={selectedCertificate.originalUrl || selectedCertificate.previewUrl}
                      alt="Preview"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/fallback.png";
                      }}
                    />
                  </div>
                </div>
                
                {/* Botões Flutuantes Contextuais do Modal Selecionado */}
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

            {/* Mapeamento Dinâmico da Listagem Geral de Modelos */}
            {certificates.map((cert) => (
              <div className="certificate-item" key={cert.id}>
                <span className="certificate-name" title={cert.name}>{cert.name}</span>
                <div className="certificate-card" role="button" tabIndex={0} onClick={() => setSelectedCertificate(cert)}>
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

          {/* Esteira Horizontal de Projetos Modificados Recentemente */}
          <div className="recentes-container">
            <h2>EDITADOS RECENTEMENTE</h2>
            <div className="recentes-lista">
              {recentes.map((item) => (
                <div key={item.id} className="recente-card" onClick={() => handleAbrirProjeto(item.id)}>
                  <img src={item.thumbnail_path} alt="preview" />
                  <div className="recente-info">
                    <h3>{item.title}</h3>
                    <p>Última edição: {new Date(item.updated_at).toLocaleDateString("pt-BR")}</p>
                    <span>
                      {typeof item.nomes_lista?.[0] === "object"
                        ? item.nomes_lista?.[0]?.nome
                        : item.nomes_lista?.[0] || "Projeto"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Home;
