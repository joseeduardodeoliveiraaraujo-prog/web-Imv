import "./Editor.css";
import { useParams, useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {jsPDF} from "jspdf";

const drawWrappedText = (ctx, text, x, y, maxWidth, lineHeight, justify = true) => {
  if (!text) return;

  const words = text.split(" ");
  let lines = [];
  let currentLine = [];

  // 1. Primeiro, organizamos as palavras em um array de linhas
  words.forEach(word => {
    let testLine = [...currentLine, word].join(" ");
    let metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [word];
    } else {
      currentLine.push(word);
    }
  });
  lines.push(currentLine); // Adiciona a última linha

  // 2. Agora desenhamos cada linha
  const xEsquerdo = x - (maxWidth / 2);
  lines.forEach((lineWords, index) => {
    const isLastLine = index === lines.length - 1;
    let currentY = y + (index * lineHeight);
    
    // Se for a última linha ou só tiver uma palavra, não justifica (alinha à esquerda/centro)
    if (!justify || isLastLine || lineWords.length <= 1) {
      ctx.textAlign = "left"; 
      ctx.fillText(lineWords.join(" "), xEsquerdo, currentY);
    } else {
      // LÓGICA DE JUSTIFICAÇÃO
      let totalWordsWidth = lineWords.reduce((sum, word) => sum + ctx.measureText(word).width, 0);
      let totalSpaceWidth = maxWidth - totalWordsWidth;
      let spaceBetweenWords = totalSpaceWidth / (lineWords.length - 1);
      
      let startX = x - (maxWidth / 2); // Começa na borda esquerda da área
      let currentX = startX;

      lineWords.forEach((word, wordIndex) => {
        ctx.textAlign = "left";
        ctx.fillText(word, currentX, currentY);
        // O próximo X é: largura da palavra + o espaço calculado
        currentX += ctx.measureText(word).width + spaceBetweenWords;
      });
    }
  });
};

const CertificadoCanvas = ({ certificate, nome, textoCorpo, corNome, corCorpo, posicaoNome, posicaoCorpo, isDragging, onMouseDown, onMouseMove, onMouseUp }) => {
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
      if (isDragging && (posicaoNome.x === canvas.width / 2 || posicaoCorpo.x === canvas.width / 2)) {
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
      // --- 1. DESENHAR O NOME DO ALUNO ---
      ctx.font = "bold 65px Inter, sans-serif";
      ctx.fillStyle = corNome;
      ctx.textAlign = "center";
      // Se o nome estiver vazio na lista, mostra o guia "Nome do Aluno"
      ctx.fillText(nome || "Nome do Aluno", posicaoNome.x, posicaoNome.y);

      // --- 2. DESENHAR O TEXTO DO CORPO (TEXTO DE BAIXO) ---
      // Usamos uma fonte um pouco menor (ex: 35px) e sem o 'bold' para diferenciar
      ctx.font = "35px Inter, sans-serif"; 
      ctx.fillStyle = corCorpo; 
      
      const larguraMaxima = canvas.width * 0.8;
      const alturaLinha = 45; // Espaçamento entre linhas
      

      drawWrappedText(
        ctx, 
        textoCorpo || "Texto do certificado aparece aqui", 
        posicaoCorpo.x, 
        posicaoCorpo.y, 
        larguraMaxima, 
        alturaLinha,
        true
      );
    };
  }, [certificate, nome, textoCorpo, corNome, corCorpo, posicaoNome, posicaoCorpo, isDragging]);

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
  const [nomesLista, setNomesLista] = useState([""]);
  const [isDragging, setIsDragging] = useState(false);
  const [itemArrastado, setItemArrastado] = useState(null);

  // Estados do NOME (Cor e Posição)
  const [corNome, setCorNome] = useState("#000000");
  const [posicaoNome, setPosicaoNome] = useState({ x: 500, y: 300 });

  // Estados do CORPO (Texto, Cor e Posição)
  const [textoCorpo, setTextoCorpo] = useState("");
  const [corCorpo, setCorCorpo] = useState("#000000");
  const [posicaoCorpo, setPosicaoCorpo] = useState({ x: 500, y: 500 });


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

  if (Math.abs(mouseX - posicaoNome.x) < 300 && Math.abs(mouseY - posicaoNome.y) < 50) {
    setItemArrastado("nome");
    setIsDragging(true);
  }
    // Checa se clicou no Corpo
  else if (Math.abs(mouseX - posicaoCorpo.x) < 400 && Math.abs(mouseY - posicaoCorpo.y) < 100) {
    setItemArrastado("corpo");
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

  if (itemArrastado === "nome") {
    setPosicaoNome({ x: mouseX, y: mouseY });
  } 
  else if (itemArrastado === "corpo") {
    setPosicaoCorpo({ x: mouseX, y: mouseY });
  }

};

  const handleMouseUp = () => {
    setIsDragging(false);
    setItemArrastado(null);
  }

  // Download
 const handleDownloadPDF = async () => {
    const nomesValidos = nomesLista.filter(n => n.trim() !== "");
    if (nomesValidos.length === 0) return alert("Insira nomes na lista!");

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = certificate.previewUrl;

    img.onload = () => {
      // Criamos o PDF com a orientação baseada na imagem (paisagem ou retrato)
      const orientation = img.width > img.height ? "l" : "p";
      const pdf = new jsPDF(orientation, "px", [img.width, img.height]);

      const tempCanvas = document.createElement("canvas");
      const ctx = tempCanvas.getContext("2d");
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;

      nomesValidos.forEach((nome, index) => {
        ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(img, 0, 0);
        // 1. Desenha o Nome
        ctx.font = "bold 65px Inter, sans-serif";
        ctx.fillStyle = corNome;
        ctx.textAlign = "center";
        ctx.fillText(nome, posicaoNome.x, posicaoNome.y);
        // 2. Desenha o Texto do Corpo
        ctx.font = "35px Inter, sans-serif";
        ctx.fillStyle = corCorpo;

        const larguraMaxima = tempCanvas.width * 0.8;
        const alturaLinha = 45;

        drawWrappedText(
          ctx, 
          textoCorpo || "", 
          posicaoCorpo.x, 
          posicaoCorpo.y, 
          larguraMaxima, 
          alturaLinha,
          true
        );

        const imgData = tempCanvas.toDataURL("image/png");
        
        // Adiciona página se não for o primeiro nome
        if (index > 0) pdf.addPage([img.width, img.height], orientation);
        
        pdf.addImage(imgData, "PNG", 0, 0, img.width, img.height);
      });

      pdf.save("todos-os-certificados.pdf");
    };
  };

  const handleDownloadZIP = async () => {
    const zip = new JSZip();
    const nomesValidos = nomesLista.filter(n => n.trim() !== "");
    if (nomesValidos.length === 0) return alert("Insira nomes na lista!");

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = certificate.previewUrl;

    img.onload = async () => {
      const tempCanvas = document.createElement("canvas");
      const ctx = tempCanvas.getContext("2d");
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;

      for (let nome of nomesValidos) {
        ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(img, 0, 0);
        // 1. Desenha o Nome
        ctx.font = "bold 65px Inter, sans-serif";
        ctx.fillStyle = corNome;
        ctx.textAlign = "center";
        ctx.fillText(nome, posicaoNome.x, posicaoNome.y);

        // 2. Desenha o Texto do Corpo (NOVO)
        ctx.font = "35px Inter, sans-serif";
        ctx.fillStyle = corCorpo;

        const larguraMaxima = tempCanvas.width * 0.8;
      const alturaLinha = 45;

      drawWrappedText(
        ctx, 
        textoCorpo || "", 
        posicaoCorpo.x, 
        posicaoCorpo.y, 
        larguraMaxima, 
        alturaLinha,
        true
      );

        const dataUrl = tempCanvas.toDataURL("image/png").split(",")[1];
        zip.file(`${nome.replace(/\s+/g, "_")}.png`, dataUrl, { base64: true });
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "certificados-individuais.zip");
    };
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
            textoCorpo={textoCorpo}
            corNome={corNome}        // Mudou aqui
            corCorpo={corCorpo}
            posicaoNome={posicaoNome}
            posicaoCorpo={posicaoCorpo}
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
            className="editor-input input-color-picker" 
            value={corNome} 
            onChange={(e) => setCorNome(e.target.value)} 
          />
        </div>

        <div className="control-group">
          <label>Texto do Certificado </label>
          <textarea
            className="editor-input bulk-area"
            placeholder="Ex: participou do evento realizado em..."
            value={textoCorpo}
            onChange={(e) => setTextoCorpo(e.target.value)}
           
          />
        </div>

        <div className="control-group">
          <label>Cor do Texto</label>
          <input 
            type="color" 
            className="editor-input input-color-picker" 
            value={corCorpo} 
            onChange={(e) => setCorCorpo(e.target.value)} 
          />
        </div>



        {/* Mudei o texto para 'Baixar Tudo' para combinar com a nova lógica */}
        <div className="download-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="btn-primary" onClick={handleDownloadPDF}>
            Baixar Tudo em PDF
          </button>
          
          <button className="btn-secondary" onClick={handleDownloadZIP} style={{ 
            
          }}>
            Baixar Imagens Individuais (.ZIP)
          </button>
        </div>
      </aside>
    </div>
  </div>
);
};

export default Editor;