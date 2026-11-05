import Header from "../components/Header/Header";
import "./Home.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHistory,
  FaList,
  FaSearch,
  FaThLarge,
} from "react-icons/fa";
import { confirmDialog } from "../components/ConfirmDialog/confirmStore";
import { toast } from "../components/Toast/toastStore";
import { deleteCertificate } from "../services/certificatesApi";
import CertificateCard from "./Home/components/CertificateCard";
import CertificatePreviewModal from "./Home/components/CertificatePreviewModal";
import HomeEmptyState from "./Home/components/HomeEmptyState";
import HomeMetrics from "./Home/components/HomeMetrics";
import HomeTip from "./Home/components/HomeTip";
import RecentProjectCard from "./Home/components/RecentProjectCard";
import UploadCard from "./Home/components/UploadCard";
import { useCertificateUpload } from "./Home/hooks/useCertificateUpload";
import { useHomeData } from "./Home/hooks/useHomeData";
import {
  countCreatedThisMonth,
  formatLastModified,
  getRequestErrorMessage,
} from "./Home/utils/homeFormatters";

const preloadEditorModule = () => {
  import("./Editor/EditorPage").catch(() => {});
};

/**
 * COMPONENT: Home
 * RESPONSIBILITY: Compor a dashboard de modelos de certificados e projetos recentes.
 * Dados em useHomeData; upload em useCertificateUpload.
 */
const Home = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [actionError, setActionError] = useState("");

  const {
    certificates,
    recentes,
    loadError,
    isLoading,
    reload,
    addCertificate,
    removeCertificate,
  } = useHomeData(user);

  const {
    fileInputRef,
    isDragging,
    isUploading,
    uploadError,
    openFilePicker,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useCertificateUpload({ user, onUploaded: addCertificate });

  useEffect(() => {
    if (selectedCertificate) preloadEditorModule();
  }, [selectedCertificate]);

  const filteredCertificates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return certificates;

    return certificates.filter((certificate) =>
      certificate.name.toLowerCase().includes(query)
    );
  }, [certificates, searchQuery]);

  const lastModified = useMemo(
    () => formatLastModified(recentes[0]?.updated_at),
    [recentes]
  );

  const newThisMonth = useMemo(
    () => countCreatedThisMonth(certificates),
    [certificates]
  );

  const closeModal = () => setSelectedCertificate(null);

  const handleEdit = () => {
    if (!selectedCertificate) return;
    closeModal();
    navigate(`/editor/${selectedCertificate.id}`);
  };

  const handleDelete = async (certificate) => {
    const target = certificate || selectedCertificate;
    if (!user || !target) return;

    const confirmed = await confirmDialog({
      title: "Excluir modelo?",
      message: `"${target.name}" e os projetos salvos com este modelo serão excluídos. Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir modelo",
      tone: "danger",
    });

    if (!confirmed) return;

    setActionError("");

    try {
      const token = await user.getIdToken();
      await deleteCertificate(target.id, token);

      removeCertificate(target.id);
      setSelectedCertificate((current) =>
        current?.id === target.id ? null : current
      );
      toast.success("Modelo excluído.");
    } catch (error) {
      console.error("Erro ao deletar:", error);
      setActionError(
        getRequestErrorMessage(
          error,
          "Não foi possível excluir o modelo. Tente novamente."
        )
      );
    }
  };

  const renderCertificates = () => {
    if (filteredCertificates.length > 0) {
      return (
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
      );
    }

    if (loadError) return null;

    if (isLoading) {
      return (
        <HomeEmptyState
          title="Carregando modelos..."
          description="Isso leva só um instante."
          busy
        />
      );
    }

    return (
      <HomeEmptyState
        title={certificates.length > 0 ? "Nenhum modelo encontrado" : "Nenhum modelo ainda"}
        description={
          certificates.length > 0
            ? "Tente outro termo de busca."
            : "Envie seu primeiro modelo no campo acima."
        }
      />
    );
  };

  return (
    <>
      <Header
        user={user}
        onLogout={onLogout}
        onNewModel={openFilePicker}
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
            tabIndex={-1}
            aria-hidden="true"
          />

          <div className="home-layout">
            <div className="home-main">
              <section className="certificates-section" aria-labelledby="models-title">
                <div className="models-header">
                  <div className="models-heading">
                    <h2 className="models-title" id="models-title">
                      Modelos de Certificados
                    </h2>
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
                        className={viewMode === "grid" ? "is-active" : undefined}
                        onClick={() => setViewMode("grid")}
                        title="Visualização em grade"
                        aria-label="Visualização em grade"
                        aria-pressed={viewMode === "grid"}
                      >
                        <FaThLarge aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={viewMode === "list" ? "is-active" : undefined}
                        onClick={() => setViewMode("list")}
                        title="Visualização em lista"
                        aria-label="Visualização em lista"
                        aria-pressed={viewMode === "list"}
                      >
                        <FaList aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                <UploadCard
                  onUpload={openFilePicker}
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
                    <button type="button" onClick={() => setActionError("")}>
                      Fechar
                    </button>
                  </div>
                )}

                {loadError && (
                  <div className="home-alert" role="alert">
                    <span>{loadError}</span>
                    <button type="button" onClick={reload}>
                      Tentar novamente
                    </button>
                  </div>
                )}

                {renderCertificates()}
              </section>
            </div>

            <aside className="home-aside">
              <section className="recentes-section" aria-labelledby="recentes-title">
                <div className="recentes-header">
                  <div className="recentes-heading">
                    <FaHistory aria-hidden="true" />
                    <h3 id="recentes-title">Recentes / Editados</h3>
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
                        onOpen={(id) => navigate(`/project/${id}`)}
                        onPreload={preloadEditorModule}
                      />
                    ))}
                  </div>
                ) : (
                  <HomeEmptyState
                    title={isLoading ? "Carregando..." : "Sem projetos"}
                    description={isLoading ? "" : "Salve um projeto no editor."}
                    busy={isLoading}
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
