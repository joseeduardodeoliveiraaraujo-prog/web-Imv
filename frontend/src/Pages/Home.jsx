import Header from "../components/Header/Header";
import "./Home.css";
import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHistory,
  FaList,
  FaSearch,
  FaThLarge,
} from "react-icons/fa";
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
import HomeMetrics from "./Home/components/HomeMetrics";
import HomeTip from "./Home/components/HomeTip";
import RecentProjectCard from "./Home/components/RecentProjectCard";
import UploadCard from "./Home/components/UploadCard";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR");
};

const getExtension = (name = "") => {
  if (!name.includes(".")) return "IMG";

  const extension = name.split(".").pop().toUpperCase();
  return extension === "JPEG" ? "JPG" : extension.slice(0, 4);
};

const formatCertificate = (cert) => ({
  id: cert.id,
  name: cert.title,
  previewUrl: cert.thumbnail_path,
  originalUrl: cert.image_path,
  createdAt: formatDate(cert.created_at),
  createdAtRaw: cert.created_at,
  extension: getExtension(cert.title),
});

const getLoadErrorMessage = (error) => {
  if (error?.status === 429) {
    return "Muitas requisições. Aguarde alguns instantes e tente novamente.";
  }

  return "Não foi possível carregar os modelos. Verifique a conexão e tente novamente.";
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // ==========================================
  // REFS
  // ==========================================
  const fileInputRef = useRef(null);

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

    setLoadError("");

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
          setLoadError("");
        } else {
          console.error(
            "Erro ao carregar certificados:",
            certificatesResult.reason
          );
          setLoadError(getLoadErrorMessage(certificatesResult.reason));
        }

        if (projectsResult.status === "fulfilled") {
          setRecentes(projectsResult.value);
        } else {
          console.error("Erro ao carregar projetos:", projectsResult.reason);
        }
      } catch (error) {
        if (isActive) {
          console.error("Erro ao carregar dados:", error);
          setLoadError(getLoadErrorMessage(error));
        }
      }
    };

    carregarDados();

    return () => {
      isActive = false;
    };
  }, [user, reloadKey]);

  // ==========================================
  // DERIVED DATA (DADOS CALCULADOS)
  // ==========================================
  const filteredCertificates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return certificates;

    return certificates.filter((certificate) =>
      certificate.name.toLowerCase().includes(query)
    );
  }, [certificates, searchQuery]);

  const lastModified = useMemo(() => {
    const latest = recentes[0]?.updated_at;
    if (!latest) return "—";

    const date = new Date(latest);
    if (Number.isNaN(date.getTime())) return "—";

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    return isToday
      ? `Hoje, ${date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : date.toLocaleDateString("pt-BR");
  }, [recentes]);

  const newThisMonth = useMemo(() => {
    const now = new Date();

    return certificates.filter((certificate) => {
      if (!certificate.createdAtRaw) return false;

      const date = new Date(certificate.createdAtRaw);
      return (
        !Number.isNaN(date.getTime()) &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [certificates]);

  // ==========================================
  // HANDLERS (EVENTOS E INTERAÇÕES)
  // ==========================================

  /**
   * EVENT: handleUploadClick
   * DESCRIPTION: Simula um evento de clique no input de arquivo oculto via referência do DOM.
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * FUNCTION: processUpload
   * DESCRIPTION: Valida tipo/tamanho do arquivo e o envia para a API.
   */
  const processUpload = async (file) => {
    if (!user || !file) return;

    setUploadError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Formato inválido. Envie um arquivo PNG ou JPEG.");
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      setUploadError("O arquivo excede o limite de 5 MB.");
      return;
    }

    setIsUploading(true);

    try {
      const token = await user.getIdToken();
      const newCert = await uploadCertificate(file, token);
      setCertificates((prev) => [formatCertificate(newCert), ...prev]);
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
      setUploadError("Não foi possível enviar o modelo. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * EVENT: handleFileChange
   * DESCRIPTION: Captura o arquivo escolhido no input e dispara o upload.
   */
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    processUpload(file);
    event.target.value = "";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    if (isUploading) return;

    const file = event.dataTransfer.files?.[0];
    processUpload(file);
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
  const handleDelete = async (certificate) => {
    const target = certificate || selectedCertificate;
    if (!user || !target) return;

    const confirmDelete = window.confirm(
      "Tem certeza que deseja apagar este modelo?"
    );

    if (!confirmDelete) return;

    setActionError("");

    try {
      const token = await user.getIdToken();
      await deleteCertificate(target.id, token);

      setCertificates((prev) => prev.filter((item) => item.id !== target.id));
      setSelectedCertificate((current) =>
        current?.id === target.id ? null : current
      );
    } catch (error) {
      console.error("Erro ao deletar:", error);
      setActionError(
        error?.status === 429
          ? "Muitas requisições. Aguarde alguns instantes e tente novamente."
          : "Não foi possível excluir o modelo. Tente novamente."
      );
    }
  };

  // ==========================================
  // RENDER INTERFACE (JSX DOM STRUCTURE)
  // ==========================================
  return (
    <>
      <Header
        user={user}
        onLogout={onLogout}
        onNewModel={handleUploadClick}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="home-wrapper">
        <main className="home-content">
          <HomeMetrics
            models={certificates.length}
            projects={recentes.length}
            lastModified={lastModified}
            newThisMonth={newThisMonth}
          />

          <input
            type="file"
            accept="image/png,image/jpeg"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <div className="home-layout">
            <div className="home-main">
              <section className="certificates-section">
                <div className="models-header">
                  <div className="models-heading">
                    <h2 className="models-title">Modelos de Certificados</h2>
                    <p className="models-subtitle">
                      Gerencie e organize os layouts de certificados do
                      instituto
                    </p>
                  </div>

                  <div className="models-controls">
                    <label className="models-search">
                      <FaSearch aria-hidden="true" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) =>
                          setSearchQuery(event.target.value)
                        }
                        placeholder="Buscar modelo..."
                        aria-label="Buscar modelos de certificado"
                      />
                    </label>

                    <div className="view-toggle" role="group" aria-label="Modo de visualização">
                      <button
                        type="button"
                        className={
                          viewMode === "grid" ? "is-active" : undefined
                        }
                        onClick={() => setViewMode("grid")}
                        title="Visualização em grade"
                        aria-pressed={viewMode === "grid"}
                      >
                        <FaThLarge aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={
                          viewMode === "list" ? "is-active" : undefined
                        }
                        onClick={() => setViewMode("list")}
                        title="Visualização em lista"
                        aria-pressed={viewMode === "list"}
                      >
                        <FaList aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                <UploadCard
                  onUpload={handleUploadClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  isDragging={isDragging}
                  isUploading={isUploading}
                  error={uploadError}
                />

                {actionError && (
                  <div className="home-alert" role="alert">
                    <span>{actionError}</span>
                    <button
                      type="button"
                      onClick={() => setActionError("")}
                    >
                      Fechar
                    </button>
                  </div>
                )}

                {loadError && (
                  <div className="home-alert" role="alert">
                    <span>{loadError}</span>
                    <button
                      type="button"
                      onClick={() => setReloadKey((value) => value + 1)}
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}

                {filteredCertificates.length > 0 ? (
                  <div
                    className={`certificates-grid${
                      viewMode === "list" ? " certificates-grid--list" : ""
                    }`}
                  >
                    {filteredCertificates.map((cert) => (
                      <CertificateCard
                        key={cert.id}
                        certificate={cert}
                        view={viewMode}
                        onSelect={setSelectedCertificate}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                ) : loadError ? null : (
                  <HomeEmptyState
                    title={
                      certificates.length > 0
                        ? "Nenhum modelo encontrado"
                        : "Nenhum modelo ainda"
                    }
                    description={
                      certificates.length > 0
                        ? "Tente outro termo de busca."
                        : "Envie seu primeiro modelo no campo acima."
                    }
                  />
                )}
              </section>
            </div>

            <aside className="home-aside">
              <section className="recentes-section">
                <div className="recentes-header">
                  <div className="recentes-heading">
                    <FaHistory aria-hidden="true" />
                    <h3>Recentes / Editados</h3>
                  </div>
                  <span className="recentes-count">
                    {recentes.length} recentes
                  </span>
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
                  <HomeEmptyState
                    title="Sem projetos"
                    description="Salve um projeto no editor."
                  />
                )}
              </section>

              <HomeTip />
            </aside>
          </div>
        </main>
      </div>

      {selectedCertificate && (
        <CertificatePreviewModal
          certificate={selectedCertificate}
          onClose={closeModal}
          onEdit={handleEdit}
          onDelete={() => handleDelete(selectedCertificate)}
        />
      )}
    </>
  );
};

export default Home;
