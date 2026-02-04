import "./Editor.css";
import { useParams, useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";

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
  const [indexAtual, setIndexAtual] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  // Texto atual baseado na navegação da lista
  const textoAtual = nomesLista[indexAtual] || "Nome do Aluno";

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

  // Lógica do Canvas
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

      if (isDragging && posicao.x === canvas.width / 2) {
        ctx.save(); // Salva o estado do canvas
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        
        // Estilo da linha (Rosa Canva)
        ctx.strokeStyle = "#e056fd"; 
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 10]); // Linha tracejada
        ctx.stroke();
        ctx.restore(); // Restaura para não afetar o texto
      }

      // Só desenha o texto no canvas se NÃO estivermos editando via input flutuante
      if (!isEditing) {
        ctx.font = "bold 65px Inter, sans-serif";
        ctx.fillStyle = cor;
        ctx.textAlign = "center";
        ctx.fillText(textoAtual, posicao.x, posicao.y);
      }
    };
  }, [certificate, textoAtual, cor, posicao, isEditing]);

  // Handlers de Mouse
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Colisão simples: permite arrastar se clicar perto do texto
    if (Math.abs(mouseX - posicao.x) < 400 && Math.abs(mouseY - posicao.y) < 100) {
      setIsDragging(true);
    } else {
      setIsEditing(false); // Fecha edição se clicar fora
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isEditing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Primeiro calculamos os valores brutos
    let mouseX = (e.clientX - rect.left) * scaleX;
    let mouseY = (e.clientY - rect.top) * scaleY;

    // --- LÓGICA DE CENTRALIZAÇÃO (SNAP) ---
    const centroX = canvas.width / 2;
    const margemSnap = 40; 

    if (Math.abs(mouseX - centroX) < margemSnap) {
      mouseX = centroX; // Gruda no centro
    }

    // Agora enviamos o valor final (já com o snap aplicado) para o estado
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
        <main className="editor-workspace">
          <div style={{ position: "relative", display: "inline-block" }}>
            <canvas
              ref={canvasRef}
              className="editor-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={() => { setIsEditing(true); setIsDragging(false); }}
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
            />

            {/* Input estilo Canva (Flutuante sobre o Canvas) */}
            {isEditing && (
              <textarea
                autoFocus
                className="floating-input"
                style={{
                  left: `${(posicao.x / canvasRef.current.width) * 100}%`,
                  top: `${(posicao.y / canvasRef.current.height) * 100}%`,
                  color: cor,
                }}
                value={textoAtual}
                onChange={(e) => {
                  const novaLista = [...nomesLista];
                  novaLista[indexAtual] = e.target.value;
                  setNomesLista(novaLista);
                }}
                onBlur={() => setIsEditing(false)}
              />
            )}
          </div>
        </main>

        <aside className="editor-sidebar">
          <div className="control-group">
            <label>Lista de Nomes (Um por linha)</label>
            <textarea
              className="editor-input bulk-area" // Removido o texto daqui de dentro
              placeholder="Cole aqui a lista de nomes...&#10;Aperte Enter para cada novo nome"
              value={nomesLista.join("\n")}
              onChange={handleBulkNames}
            />
          </div>

          <div className="navigation-controls">
            <button onClick={() => setIndexAtual(prev => Math.max(0, prev - 1))}>Anterior</button>
            <span>{indexAtual + 1} de {nomesLista.length}</span>
            <button onClick={() => setIndexAtual(prev => Math.min(nomesLista.length - 1, prev + 1))}>Próximo</button>
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

          <button className="btn-primary" onClick={handleDownload}>
            Baixar Certificado Atual
          </button>
        </aside>
      </div>
    </div>
  );
};

export default Editor;