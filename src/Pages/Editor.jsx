import "./Editor.css";
import { useParams, useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {jsPDF} from "jspdf";

const drawWrappedText = (ctx, text, x, y, maxWidth, lineHeight, justify = true) => {
  if (!text) return 0; // Retorna 0 se o texto estiver vazio

  const words = text.split(" ");
  let lines = [];
  let currentLine = [];

  // 1. Organiza as palavras em linhas
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
  lines.push(currentLine); 

  // 2. Desenha cada linha
  const xEsquerdo = x - (maxWidth / 2);
  lines.forEach((lineWords, index) => {
    const isLastLine = index === lines.length - 1;
    let currentY = y + (index * lineHeight);
    
    if (!justify || isLastLine || lineWords.length <= 1) {
      ctx.textAlign = "left"; 
      ctx.fillText(lineWords.join(" "), xEsquerdo, currentY);
    } else {
      let totalWordsWidth = lineWords.reduce((sum, word) => sum + ctx.measureText(word).width, 0);
      let totalSpaceWidth = maxWidth - totalWordsWidth;
      let spaceBetweenWords = totalSpaceWidth / (lineWords.length - 1);
      
      let startX = x - (maxWidth / 2); 
      let currentX = startX;

      lineWords.forEach((word) => {
        ctx.textAlign = "left";
        ctx.fillText(word, currentX, currentY);
        currentX += ctx.measureText(word).width + spaceBetweenWords;
      });
    }
  });

  // NOVIDADE: Retorna a altura total ocupada pelo bloco de texto
  return lines.length * lineHeight;
};

const CertificadoCanvas = ({ certificate, nome, textoCorpo, corNome, corCorpo, posicaoNome, posicaoCorpo, isDragging, itemHover, itemArrastado, onMouseDown, onMouseMove, onMouseUp }) => {
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

  const centroCanvas = canvas.width / 2;
  const margemErro = 5;

  const nomeNoCentro = Math.abs(posicaoNome.x - centroCanvas) <= margemErro;
  const corpoNoCentro = Math.abs(posicaoCorpo.x - centroCanvas) <= margemErro;

  // --- GUIA ROSA (Correção da lógica nomeNoCentro) ---
  if (isDragging && (nomeNoCentro || corpoNoCentro)) {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([15, 10]);
    ctx.strokeStyle = "#e056fd";
    ctx.lineWidth = 4;
    ctx.moveTo(centroCanvas, 0);
    ctx.lineTo(centroCanvas, canvas.height);
    ctx.stroke();
    ctx.restore();
  }

  // --- 1. DESENHAR O NOME DO ALUNO ---
  ctx.font = "bold 65px Inter, sans-serif";
  ctx.fillStyle = corNome;

  // Medimos a largura real do texto para que a caixa azul e a centralização fiquem perfeitas
  const larguraRealTextoNome = ctx.measureText(nome || "Nome do Aluno").width;
  // A largura da caixa de seleção deve ser o menor valor entre o texto e o limite do canvas
  const larguraCaixaNome = Math.min(larguraRealTextoNome + 40, canvas.width * 0.85);

  const alturaLinhaNome = 75;

  // Chamamos a função para desenhar
  const alturaTotalNome = drawWrappedText(
    ctx, 
    nome || "Nome do Aluno", 
    posicaoNome.x, 
    posicaoNome.y, 
    larguraCaixaNome, // Usando a largura calculada aqui!
    alturaLinhaNome, 
    false // Mantém o justify em false para o nome
  );

  // --- 2. DESENHAR O CORPO ---
  ctx.font = "35px Inter, sans-serif"; 
  ctx.fillStyle = corCorpo; 
  
  const larguraMaxCorpo = canvas.width * 0.8;
  const alturaLinhaCorpo = 45;

  const alturaTotalCorpo = drawWrappedText(
    ctx, 
    textoCorpo || "Participou com êxito do evento [Nome do Evento], realizado no dia [Data], com carga horária de [X] horas.", 
    posicaoCorpo.x, 
    posicaoCorpo.y, 
    larguraMaxCorpo, 
    alturaLinhaCorpo,
    true // Justificar corpo
  );

  const drawSelectionBox = (x, y, width, height) => {
  ctx.save();

  // 1. Definições de Estilo
  const azulCanva = "#00c4cc"; // Um azul turquesa mais moderno
  const padding = 10; // Espaço entre o texto e a borda
  const raioCanto = 8; // Arredondamento da borda
  
  const rectX = x - width / 2 - padding;
  const rectY = y - 60; // Compensação da altura da fonte
  const rectW = width + (padding * 2);
  const rectH = height + 20;

  // 2. Sombra Suave (Dá profundidade e tira o aspecto amador)
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  // 3. Desenhar a Borda Arredondada
  ctx.beginPath();
  ctx.roundRect(rectX, rectY, rectW, rectH, raioCanto);
  ctx.strokeStyle = azulCanva;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 4. Desenhar os Handles (Círculos em vez de quadrados)
  // Removemos a sombra para os handles para ficarem nítidos
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "white";
  ctx.strokeStyle = azulCanva;
  ctx.lineWidth = 2;

  const drawCircleHandle = (hx, hy) => {
    ctx.beginPath();
    ctx.arc(hx, hy, 6, 0, Math.PI * 2); // Círculo com raio 6
    ctx.fill();
    ctx.stroke();
  };

  // Posiciona os círculos exatamente nos 4 cantos
  drawCircleHandle(rectX, rectY); // Topo Esquerda
  drawCircleHandle(rectX + rectW, rectY); // Topo Direita
  drawCircleHandle(rectX, rectY + rectH); // Baixo Esquerda
  drawCircleHandle(rectX + rectW, rectY + rectH); // Baixo Direita

  ctx.restore();
};

  // Desenha se hover ou dragging
  if (itemHover === "nome" || (isDragging && itemArrastado === "nome")) {
    drawSelectionBox(posicaoNome.x, posicaoNome.y, larguraCaixaNome, alturaTotalNome);
  }

  if (itemHover === "corpo" || (isDragging && itemArrastado === "corpo")) {
    drawSelectionBox(posicaoCorpo.x, posicaoCorpo.y, larguraMaxCorpo + 40, alturaTotalCorpo);
  }
};
  }, [certificate, nome, textoCorpo, corNome, corCorpo, posicaoNome, posicaoCorpo, isDragging, itemHover, itemArrastado, onMouseDown, onMouseMove, onMouseUp]);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="editor-canvas"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
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
  const [itemHover, setItemHover] = useState(null);

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
  const canvas = e.currentTarget;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let mouseX = (e.clientX - rect.left) * scaleX;
  let mouseY = (e.clientY - rect.top) * scaleY;

  // --- 1. LÓGICA DE HOVER (Para a borda azul aparecer antes do clique) ---
  if (!isDragging) {
    const margemAproximacaoX = 300;
    const margemAproximacaoY = 60;

    const sobreNome = Math.abs(mouseX - posicaoNome.x) < margemAproximacaoX && 
                     Math.abs(mouseY - posicaoNome.y) < margemAproximacaoY;

    const sobreCorpo = Math.abs(mouseX - posicaoCorpo.x) < 400 && 
                      Math.abs(mouseY - posicaoCorpo.y) < 150;

    if (sobreNome) {
      setItemHover("nome");
    } else if (sobreCorpo) {
      setItemHover("corpo");
    } else {
      setItemHover(null);
    }
    
    // Se não está arrastando, paramos aqui.
    return; 
  }

  // --- 2. LÓGICA DE ARRASTE E MAGNETISMO (Só executa se isDragging for true) ---
  const centroX = canvas.width / 2;
  const margemMagnetismo = 40;

  if (Math.abs(mouseX - centroX) < margemMagnetismo) {
    mouseX = centroX;
  }

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
            itemHover={itemHover}       
            itemArrastado={itemArrastado}
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