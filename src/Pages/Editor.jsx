import "./Editor.css";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Editor = () => {
    const {id} = useParams();
    const navigate = useNavigate();

    const [certificate, setCertificate] = useState(null);

    useEffect(() => {
    const saved = localStorage.getItem("certificates");

    if (!saved){
      navigate("/");
      return;
    }

    const certificates = JSON.parse(saved);
    const found = certificates.find(c => c.id === id);

    if (!found) {
      navigate("/");
      return;
    }

    setCertificate(found);
  }, [id, navigate]);

  if (!certificate) {
    return <p>Carregando certificado...</p>;
  }

    return(
    <div className="editor">
      
        <header className="editor-header">
            <h1>{certificate.name}</h1>
            <button className="btn-exit" onClick={() => navigate("/")}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Sair</span>
            </button>
        </header>

        <div className="editor-container">      
        
            {/* LADO ESQUERDO*/}
            <main className="editor-workspace">
                <img
                    src={certificate.previewUrl}
                    alt={certificate.name}
                    className="editor-preview"
                />
            </main>

            {/* LADO DIREITO: Painel de Edição */}
            <aside className="editor-sidebar">
                <div className="control-group">
                    <label>Texto do Certificado</label>
                    <input 
                    type="text" 
                    className="editor-input" 
                    placeholder="Nome do aluno..." 
                    />
                </div>

                <div className="control-group">
                    <label>Data de Emissão</label>
                    <input type="date" className="editor-input" />
                </div>

                <div className="control-group">
                    <label>Cor do Texto</label>
                    <input type="color" className="editor-input" style={{height: '40px', padding: '2px'}} />
                </div>

                <button className="btn-primary">
                    Finalizar e Salvar
                </button>
            </aside>

        </div>
    </div>
    );

};

export default Editor;
 
