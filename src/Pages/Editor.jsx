import "./Editor.css";
import { useParams, useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";

const CertificadoCanvas = ({ certificate, nome, cor, posicao, isDragging, onMouseDown, onMouseMove, onMouseUp }) => {
  const canvasRef = useRef(null);

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

      // Linha de Guia Rosa (Aparece em todos sincronizadamente)
      if (isDragging && posicao.x === canvas.width / 2) {
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([15, 10]);
        ctx.strokeStyle = "#e056fd";
        ctx.lineWidth = 4;
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.restore();
      }

      ctx.font = "bold 65px Inter, sans-serif";
      ctx.fillStyle = cor;
      ctx.textAlign = "center";
      // Se o nome estiver vazio na lista, mostra o guia "Nome do Aluno"
      ctx.fillText(nome || "Nome do Aluno", posicao.x, posicao.y);
    };
  }, [certificate, nome, cor, posicao, isDragging]);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="editor-canvas"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      />
    </div>
  );
};

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados Base
  const [certificate, setCertificate] = useState(null);
  const canvasRef = useRef(null);
  const [cor, setCor] = useState("#000000");
  const [posicao, setPosicao] = useState({ x: 500, y: 300 });
  const [isDragging, setIsDragging] = useState(false);

  // Estados Novos: Lista de Nomes e Edição em Tela
  const [nomesLista, setNomesLista] = useState([""]);
  const [isEditing, setIsEditing] = useState(false);


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

  // Handlers de Mouse
  const handleMouseDown = (e) => {
  const canvas = e.currentTarget; // Pega o canvas específico que foi clicado
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;

  if (Math.abs(mouseX - posicao.x) < 400 && Math.abs(mouseY - posicao.y) < 100) {
    setIsDragging(true);
  }
};

const handleMouseMove = (e) => {
  if (!isDragging) return;

  const canvas = e.currentTarget;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let mouseX = (e.clientX - rect.left) * scaleX;
  let mouseY = (e.clientY - rect.top) * scaleY;

  const centroX = canvas.width / 2;
  if (Math.abs(mouseX - centroX) < 40) mouseX = centroX;

  setPosicao({ x: mouseX, y: mouseY });
};

  const handleMouseUp = () => setIsDragging(false);

  // Download
  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `certificado-${textoAtual}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Lógica de nomes em massa (estilo seu CSV anterior)
  const handleBulkNames = (e) => {
      // Pegamos o valor bruto para permitir quebras de linha (Enter)
    const novosNomes = e.target.value.split("\n");
    
    // Atualizamos a lista mantendo as linhas vazias enquanto o usuário digita
    setNomesLista(novosNomes);
    
    // Opcional: Só volta para o primeiro nome se a lista mudar drasticamente
    // setIndexAtual(0);
  };

  if (!certificate) return <p>Carregando certificado...</p>;

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
      {/* ÁREA CENTRAL: 
          Agora com classe 'bulk-scroll' para o CSS permitir o rolamento vertical
      */}
      <main className="editor-workspace bulk-scroll">
        {nomesLista.map((nome, index) => (
          <CertificadoCanvas
            key={index}
            certificate={certificate}
            nome={nome}
            cor={cor}
            posicao={posicao}
            isDragging={isDragging}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        ))}
      </main>

      {/* SIDEBAR: Mantive seus controles e SVG conforme solicitado */}
      <aside className="editor-sidebar">
        <div className="control-group">
          <label>Lista de Nomes (Um por linha)</label>
          <textarea
            className="editor-input bulk-area"
            placeholder="Cole aqui a lista de nomes...&#10;Aperte Enter para cada novo nome"
            value={nomesLista.join("\n")}
            onChange={handleBulkNames}
          />
        </div>

        <div className="control-group">
          <label>Cor do Texto</label>
          <input 
            type="color" 
            className="editor-input" 
            value={cor} 
            style={{ height: "45px", padding: "2px", cursor: "pointer" }}
            onChange={(e) => setCor(e.target.value)} 
          />
        </div>

        {/* Mudei o texto para 'Baixar Tudo' para combinar com a nova lógica */}
        <button className="btn-primary" onClick={() => alert("Função de ZIP em breve!")}>
          Baixar Todos os Certificados
        </button>
      </aside>
    </div>
  </div>
);
};

export default Editor;