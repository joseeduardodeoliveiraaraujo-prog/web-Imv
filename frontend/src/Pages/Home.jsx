import Header from "../components/Header/Header";
import "./Home.css";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteCertificate,
  listCertificates,
  uploadCertificate,
} from "../services/certificatesApi";
import { listProjects } from "../services/projectsApi";
import { ensureUserSynced } from "../services/usersApi";
import CertificateCard from "./Home/components/CertificateCard";
import CertificatePreviewModal from "./Home/components/CertificatePreviewModal";
import HomeEmptyState from "./Home/components/HomeEmptyState";
import HomeHero from "./Home/components/HomeHero";
import RecentProjectCard from "./Home/components/RecentProjectCard";
import UploadCard from "./Home/components/UploadCard";

const formatCertificate = (cert) => ({
  id: cert.id,
  name: cert.title,
  previewUrl: cert.thumbnail_path,
  originalUrl: cert.image_path,
});

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
  // REFS
  // ==========================================
  const fileInputRef = useRef(null);

  // ==========================================
  // DATA FETCHING FUNCTIONS (REQUISIÇÕES)
  // ==========================================

  /**
   * FUNCTION: fetchCertificates
   * DESCRIPTION: Consome o endpoint de certificados e normaliza o schema de dados vindo da API para o frontend.
   */
  const fetchCertificates = useCallback(async (token) => {
    if (!user) return [];

    const authToken = token || (await user.getIdToken());
    const data = await listCertificates(authToken);

    return data.map(formatCertificate);
  }, [user]);

  const loadCertificates = async () => {
    try {
      await ensureUserSynced(user);
      const formatted = await fetchCertificates();
      setCertificates(formatted);
    } catch (error) {
      console.error("Erro ao carregar certificados:", error);
    }
  };

  // ==========================================
  // SIDE EFFECTS (EFEITOS COLATERAIS)
  // ==========================================

  /**
   * EFFECT: Carrega modelos e projetos recentes em paralelo, sem bloquear a renderização
   * inicial da aplicação pela sincronização do usuário.
   */
  useEffect(() => {
    if (!user) return;

    let isActive = true;

    const carregarDados = async () => {
      try {
        const token = await user.getIdToken();
        const syncPromise = ensureUserSynced(user, token).catch((error) => {
          console.error("Erro ao salvar usuário:", error);
          return null;
        });

        const fetchData = () =>
          Promise.allSettled([
            listCertificates(token),
            listProjects(token),
          ]);

        let results = await fetchData();

        const needsRetry = results.some(
          (result) =>
            result.status === "rejected" && result.reason?.status === 404
        );

        if (needsRetry) {
          await syncPromise;
          results = await fetchData();
        }

        if (!isActive) return;

        const [certificatesResult, projectsResult] = results;

        if (certificatesResult.status === "fulfilled") {
          setCertificates(certificatesResult.value.map(formatCertificate));
        } else {
          console.error(
            "Erro ao carregar certificados:",
            certificatesResult.reason
          );
        }

        if (projectsResult.status === "fulfilled") {
          setRecentes(projectsResult.value);
        } else {
          console.error("Erro ao carregar projetos:", projectsResult.reason);
        }
      } catch (error) {
        if (isActive) {
          console.error("Erro ao carregar dados:", error);
        }
      }
    };

    carregarDados();

    return () => {
      isActive = false;
    };
  }, [user]);

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
      const newCert = await uploadCertificate(file, token);

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
      await deleteCertificate(selectedCertificate.id, token);

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
          <HomeHero />

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <div className="home-layout">
            <div className="home-main">
              <section className="certificates-section">
                <div className="section-header">
                  <div className="section-title-group">
                    <span className="section-label">Modelos</span>
                  </div>
                  <span className="section-count">{certificates.length}</span>
                </div>

                <div className="certificates-grid">
                  <UploadCard onUpload={handleUploadClick} />

                  {certificates.map((cert) => (
                    <CertificateCard
                      key={cert.id}
                      certificate={cert}
                      onSelect={setSelectedCertificate}
                    />
                  ))}
                </div>
              </section>
            </div>

            <aside className="home-aside">
              <section className="recentes-section">
                <div className="section-header">
                  <div className="section-title-group">
                    <span className="section-label">Recentes</span>
                  </div>
                </div>

                {recentes.length > 0 ? (
                  <div className="recentes-lista">
                    {recentes.map((item) => (
                      <RecentProjectCard
                        key={item.id}
                        project={item}
                        onOpen={handleAbrirProjeto}
                      />
                    ))}
                  </div>
                ) : (
                  <HomeEmptyState title="Sem projetos" description="Salve um projeto no editor." />
                )}
              </section>
            </aside>
          </div>
        </main>
      </div>

      {selectedCertificate && (
        <CertificatePreviewModal
          certificate={selectedCertificate}
          onClose={closeModal}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};

export default Home;
