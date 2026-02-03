import "./Editor.css";
import { useParams, useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [certificate, setCertificate] = useState(null);
  const canvasRef = useRef(null);
  const [texto, setTexto] = useState("Nome do Aluno");
  const [cor, setCor] = useState("#000000");
  const [posicao, setPosicao] = useState({ x: 500, y: 300 }); // Posição inicial (centro aproximado)
  const [isDragging, setIsDragging] = useState(false);

  // Carregar dados do certificado
  useEffect(() => {
    const saved = localStorage.getItem("certificates");
    if (!saved) {
      navigate("/");
      return;
    }

    const certificates = JSON.parse(saved);
    const found = certificates.find((c) => c.id === id);

    if (!found) {
      navigate("/");
      return;
    }

    setCertificate(found);
  }, [id, navigate]);

  // Lógica do Canvas (Desenho)
  useEffect(() => {
    if (!certificate || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.crossOrigin = "anonymous";
    img.src = certificate.previewUrl;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Desenha o Nome na posição que o usuário escolheu arrastando
      ctx.font = "bold 65px Inter, sans-serif";
      ctx.fillStyle = cor;
      ctx.textAlign = "center";
      
      // Mudança aqui: usamos posicao.x e posicao.y em vez de valores fixos
      ctx.fillText(texto, posicao.x, posicao.y);
    };
  }, [certificate, texto, cor, posicao]); // 'posicao' adicionada como dependência

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `certificado-${id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Converte a posição do clique para a escala real do canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Verifica se o clique foi perto do texto (área de colisão simples)
    if (Math.abs(mouseX - posicao.x) < 200 && Math.abs(mouseY - posicao.y) < 50) {
        setIsDragging(true);
    }
};

const handleMouseMove = (e) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    setPosicao({
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    });
};

const handleMouseUp = () => setIsDragging(false);

  if (!certificate) {
    return <p>Carregando certificado...</p>;
  }

  return (
    <div className="editor">
      <header className="editor-header">
        <h1>{certificate.name}</h1>
        <button className="btn-exit" onClick={() => navigate("/")}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sair</span>
        </button>
      </header>

      <div className="editor-container">
        {/* LADO ESQUERDO */}
        <main className="editor-workspace">
          <canvas 
            ref={canvasRef} 
            className="editor-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // Solta o texto se o mouse sair da área
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }} // Muda o ícone do mouse
          />
        </main>

        {/* LADO DIREITO */}
        <aside className="editor-sidebar">
          <div className="control-group">
            <label>Texto do Certificado</label>
            <input
              type="text"
              className="editor-input"
              placeholder="Nome do aluno..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>Cor do Texto</label>
            <input
              type="color"
              className="editor-input"
              style={{ height: "45px", padding: "2px", cursor: "pointer" }}
              value={cor}
              onChange={(e) => setCor(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={handleDownload}>
            Baixar Certificado
          </button>
        </aside>
      </div>
    </div>
  );
};

export default Editor;