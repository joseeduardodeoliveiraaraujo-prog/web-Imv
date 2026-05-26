import "./Editor.css";
import { useParams, useNavigate } from "react-router-dom";
import { useRef, useEffect, useState, useMemo } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {jsPDF} from "jspdf";
import Select from 'react-select';
import { auth } from "../services/firebase";
import { useLocation } from "react-router-dom"; 

// Quebra o texto em várias linhas respeitando maxWidth e desenha no canvas com opção de justificado
// Se comunica diretamente com o canvas via ctx e retorna a altura total para quem chamou ajustar layout (ex: selection box, cálculo de tamanho, etc.)
const drawWrappedText = (ctx, text, x, y, maxWidth, lineHeight, justify = true) => {
  if (!text) return 0;

  const PADDING_V = 20; 
  const PADDING_H = 30; 

  ctx.textBaseline = "top";
  ctx.textAlign = "left"; 
  
  const words = text.split(" ");
  let lines = [];
  let currentLine = [];

  const larguraDisponivelTexto = maxWidth - (PADDING_H * 2); // Calcula a largura real disponível para o texto dentro da caixa (considerando o padding)

  words.forEach(word => {
    let testLine = [...currentLine, word].join(" ");
    let metrics = ctx.measureText(testLine);
    
    if (metrics.width > larguraDisponivelTexto && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [word];
    } else {
      currentLine.push(word);
    }
  });
  lines.push(currentLine); 

  const xEsquerdo = x - (maxWidth / 2) + PADDING_H;

  lines.forEach((lineWords, index) => {
    const isLastLine = index === lines.length - 1;
    let currentY = y + PADDING_V + (index * lineHeight);
    
    if (!justify || isLastLine || lineWords.length <= 1) {
      ctx.fillText(lineWords.join(" "), xEsquerdo, currentY);
    } else {
      let totalWordsWidth = lineWords.reduce(
        (sum, word) => sum + ctx.measureText(word).width, 
        0
      );

      let totalSpaceWidth = larguraDisponivelTexto - totalWordsWidth;
      let spaceBetweenWords = totalSpaceWidth / (lineWords.length - 1);
      
      let currentX = xEsquerdo;

      lineWords.forEach((word) => {
        ctx.fillText(word, currentX, currentY);
        currentX += ctx.measureText(word).width + spaceBetweenWords;
      });
    }
  });

  return lines.length * lineHeight + (PADDING_V * 2); // Retorna a altura total ocupada pelo texto (linhas + padding)
};
// Componente responsável por renderizar todo o canvas do certificado (imagem, textos, seleção e guias)
// Se comunica com:
// - drawWrappedText() → para desenhar texto quebrado
// - getTextBoxSize() → calcular tamanho do texto
// - getBoxRect() → calcular bounding box da seleção
// - handlers externos: onMouseDown, onMouseMove, onMouseUp
// - estados externos: itemHover, itemSelecionado, isDragging, posições, fontes etc.
const CertificadoCanvas = ({ certificate, nome, textoCorpo, corNome, corCorpo, fonteNome, fonteCorpo, tamanhoNome, tamanhoCorpo, posicaoNome, posicaoCorpo, isDragging, itemHover, itemArrastado, itemSelecionado, onMouseDown, onMouseMove, onMouseUp, getBoxRect, getTextBoxSize }) => {
  const canvasRef = useRef(null); // Referência direta ao canvas para desenho imperativo

  useEffect(() => {// Motor principal de renderização. Sempre que alguma prop muda ele redesenha todo o canvas
    if (!certificate || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = certificate.previewUrl;

    img.onload = () => { // Só desenha depois que a imagem do certificado carrega
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const nomeParaDesenho = nome && nome.length > 0 ? nome : "Nome do Participante";
      const corpoParaDesenho = textoCorpo && textoCorpo.length > 0 
      ? textoCorpo 
      : "Participou com êxito do evento [Nome do Evento], realizado no dia [Data], com carga horária de [X] horas.";

      const centroCanvas = canvas.width / 2; // usado para alinhar e mostrar a guia central
      const margemErro = 5;

      const nomeNoCentro = Math.abs(posicaoNome.x - centroCanvas) <= margemErro;
      const corpoNoCentro = Math.abs(posicaoCorpo.x - centroCanvas) <= margemErro;

      // desenha a linha guia rosa quando arrastando e alinhado ao centro se comunica com estado isDragging e posições dos textos
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
      ctx.font = `${tamanhoNome}px "${fonteNome}", sans-serif`;
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      ctx.fillStyle = corNome;
      

      // Medimos a largura real do texto para que a caixa azul e a centralização fiquem perfeitas
      const nomeBase = nomeParaDesenho;

      const nomeBox = getTextBoxSize(
        ctx,
        nomeBase,
        tamanhoNome,
        fonteNome,
        canvas.width * 0.85
      );

      const alturaLinhaNome = tamanhoNome * 1.2;

      const alturaTotalNome = drawWrappedText(
        ctx,
        nomeBase,
        posicaoNome.x,
        posicaoNome.y,
        nomeBox.width,
        alturaLinhaNome,
        false
      );

      // --- 2. DESENHAR O CORPO ---
      ctx.font = `${tamanhoCorpo}px "${fonteCorpo}", sans-serif`;
      ctx.textBaseline = "top";
      ctx.textAlign = "center"; 
      ctx.fillStyle = corCorpo;

      const textoBase = corpoParaDesenho;

      const corpoBox = getTextBoxSize(
        ctx,
        textoBase,
        tamanhoCorpo,
        fonteCorpo,
        canvas.width * 0.8
      );

      const alturaLinhaCorpo = tamanhoCorpo * 1.2;

      const alturaTotalCorpo = drawWrappedText(
        ctx, 
        textoBase, 
        posicaoCorpo.x, 
        posicaoCorpo.y, 
        corpoBox.width, 
        alturaLinhaCorpo,
        true
      );
      // Desenha a caixa azul de seleção e os handles
      // Se comunica com getBoxRect() para calcular posição correta
      const drawSelectionBox = (x, y, width, height, showHandles = false) => {
        ctx.save();

        const azulCanva = "#00c4cc";
        const raioCanto = 8;

        const getBoxRect = (x, y, width, height) => {
          return {
            x: x - width / 2,
            y: y, // <- NÃO centraliza verticalmente
            w: width,
            h: height
          };
        };// centraliza corretamente a caixa com base no texto

        const box = getBoxRect(x, y, width, height);

        const rectX = box.x;
        const rectY = box.y;
        const rectW = box.w;
        const rectH = box.h;

        // sombra
        ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        // borda
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, rectW, rectH, raioCanto);
        ctx.strokeStyle = azulCanva;
        ctx.lineWidth = 2;
        ctx.stroke();

        // SÓ desenha handles se estiver selecionado
        if (showHandles) {
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;

          ctx.fillStyle = "white";
          ctx.strokeStyle = azulCanva;
          ctx.lineWidth = 2;

          const drawCircleHandle = (hx, hy) => {
            ctx.beginPath();
            ctx.arc(hx, hy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          };

          drawCircleHandle(rectX, rectY);
          drawCircleHandle(rectX + rectW, rectY);
          drawCircleHandle(rectX, rectY + rectH);
          drawCircleHandle(rectX + rectW, rectY + rectH);
        }

        ctx.restore();
      };

      if (itemHover === "nome" && itemSelecionado !== "nome") {
        drawSelectionBox(posicaoNome.x, posicaoNome.y, nomeBox.width, alturaTotalNome, false);
      }

      if (itemSelecionado === "nome") {
        drawSelectionBox(posicaoNome.x, posicaoNome.y, nomeBox.width, alturaTotalNome, true);
      }

      if (itemHover === "corpo" && itemSelecionado !== "corpo") {
        drawSelectionBox(posicaoCorpo.x, posicaoCorpo.y, corpoBox.width, alturaTotalCorpo, false);
      }

      if (itemSelecionado === "corpo") {
        drawSelectionBox(posicaoCorpo.x, posicaoCorpo.y, corpoBox.width, alturaTotalCorpo, true);
      }
    };
  }, [certificate, nome, textoCorpo, corNome, corCorpo, posicaoNome, posicaoCorpo,fonteNome, fonteCorpo,tamanhoNome, tamanhoCorpo, isDragging, itemHover, itemArrastado, itemSelecionado]);// Dependências que disparam re-render do canvas comunicação com todo o estado externo do editor

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
// Componente principal do editor de certificados
// Controla estados, interação do canvas, download e passa tudo para CertificadoCanvas
// Se comunica diretamente com:
// - CertificadoCanvas (props)
// - drawWrappedText()
// - jsPDF / JSZip
// - React Router (useParams, useNavigate)
const Editor = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isProjectRoute = location.pathname.startsWith("/project/");

 // Estados Base
  const [certificate, setCertificate] = useState(null);
  const [nomesLista, setNomesLista] = useState([{ nome: "", overrides: {} }]);
  const [bulkText, setBulkText] = useState(""); // usado para controlar o textarea de edição em massa de nomes
  const isDraggingRef = useRef(false);
  const itemArrastadoRef = useRef(null);
  const hoverRef = useRef(null);
  const [itemHover, setItemHover] = useState(null);

  // Estados do NOME (Cor e Posição)
  const [corNome, setCorNome] = useState("#000000");
  const [posicaoNome, setPosicaoNome] = useState({ x: 500, y: 300 });

  // Estados do CORPO (Texto, Cor e Posição)
  const [textoCorpo, setTextoCorpo] = useState("");
  const [corCorpo, setCorCorpo] = useState("#000000");
  const [posicaoCorpo, setPosicaoCorpo] = useState({ x: 500, y: 500 });
  const [itemSelecionado, setItemSelecionado] = useState(null);

  // Estados de fontes
  const [fonteNome, setFonteNome] = useState("Inter");
  const [fonteCorpo, setFonteCorpo] = useState("Inter");
  const [tamanhoNome, setTamanhoNome] = useState(90)
  const [tamanhoCorpo, setTamanhoCorpo] = useState(40)

  // Estado para controle da tela de carregamento
  const [estaGerando, setEstaGerando] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState("");
  const [progresso, setProgresso] = useState(0); // Valor de 0 a 100

  // Estado para controle do menu de download (PDF, ZIP, PDF+ZIP)
  const [menuDownloadAberto, setMenuDownloadAberto] = useState(false);

  // Estado para controlar edição em massa de nomes (textarea)
  const [indexEditando, setIndexEditando] = useState(null);

  // Estado para controlar o projeto atual (pode ser usado para futuras features de múltiplos projetos, organização, etc.)
  const [projectId, setProjectId] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // Ref para otimizar renderização do canvas e evitar criação de objetos desnecessários durante drag e hover
  const imageCacheRef = useRef(null);

  // Função para pré-carregar a imagem do certificado e evitar lag durante a renderização no canvas. Retorna a imagem já carregada ou usa o cache se já tiver sido carregada antes.
  const preloadCertificateImage = async () => {
    if (imageCacheRef.current) return imageCacheRef.current;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = certificate.previewUrl;

      img.onload = () => {
        imageCacheRef.current = img;
        resolve(img);
      };

      img.onerror = reject;
    });
  };

  const updateStyle = (property, value, globalSetter) => {
    // Se indexEditando for um número (0, 1, 2...), editamos o individual
    if (indexEditando !== null) {
      const novaLista = [...nomesLista];
      
      // Atualizamos apenas o objeto no índice que está "focado"
      novaLista[indexEditando] = {
        ...novaLista[indexEditando],
        overrides: {
          ...novaLista[indexEditando].overrides,
          [property]: value // Ex: corNome: "#FF0000"
        }
      };
      
      setNomesLista(novaLista);
    } else {
      // Se for null, editamos o estado global (comportamento padrão atual)
      globalSetter(value);
    }
  };

  // Filtra a lista de nomes removendo vazios e garante pelo menos um nome padrão
  // Se comunica com nomesLista e com renderização dos CertificadoCanvas
  // 1. Filtra apenas o que o usuário REALMENTE digitou
  const nomesValidos = useMemo(() => {
    return nomesLista.filter(item => 
      item && 
      typeof item.nome === 'string' && 
      item.nome.trim() !== "" // Aqui ele remove as linhas de "Enter" vazias
    );
  }, [nomesLista]);

  // 2. Retorna o texto do corpo apenas se o usuário escreveu algo
  const textoCorpoBase = useMemo(() => {
    const texto = textoCorpo?.trim();
    return texto && texto.length > 0 ? texto : "";
  }, [textoCorpo]);

  // Carregar dados do certificado baseado no id da rota 1 teste
  // Dentro do seu useEffect no Editor.js
  // Dentro do seu useEffect no Editor.js
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const user = auth.currentUser;
        const token = await user?.getIdToken();

        if (!token) {
          navigate("/login");
          return;
        }

        const endpoint = isProjectRoute
          ? `${API_URL}/projects/${id}`
          : `${API_URL}/certificates/${id}`;

        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Erro ao carregar");

        const data = await response.json();

        if (isProjectRoute) {
          setProjectId(data.id);

          setCertificate({
            id: data.certificate_id,
            name: data.title,
            previewUrl: data.image_path
          });

          // --- SOLUÇÃO PARA O TEXTAREA DE NOMES ---
          const listaSincronizada = data.nomes_lista || [{ nome: "", overrides: {} }];
          setNomesLista(listaSincronizada);
          
          // Transformamos o array de objetos de volta em texto separado por linhas
          const textoNomes = listaSincronizada
            .map(item => item.nome)
            .filter(nome => nome.trim() !== "")
            .join("\n");
          setBulkText(textoNomes); 
          // ----------------------------------------

          setTextoCorpo(data.texto_corpo || "");
          setCorNome(data.cor_nome || "#000000");
          setFonteNome(data.fonte_nome || "Inter");
          setTamanhoNome(data.tamanho_nome || 90);
          setCorCorpo(data.cor_corpo || "#000000");
          setFonteCorpo(data.fonte_corpo || "Inter");
          setTamanhoCorpo(data.tamanho_corpo || 40);

          setPosicaoNome(data.posicao_nome || { x: 0, y: 0 });
          setPosicaoCorpo(data.posicao_corpo || { x: 0, y: 0 });

        } else {
          setCertificate({
            ...data,
            name: data.title,
            previewUrl: data.image_path
          });
        }

      } catch (error) {
        console.error(error);
        navigate("/");
      }
    };

    if (id) carregarDados();

  }, [id, navigate, isProjectRoute]);

  // Sempre que o certificado muda, pré-carrega a imagem para garantir que o canvas renderize sem lag. Se a imagem já tiver sido carregada antes, usa o cache.
  useEffect(() => {
    if (!certificate?.previewUrl) return;

    imageCacheRef.current = null; // limpa cache antigo
    preloadCertificateImage();
  }, [certificate?.previewUrl]);

  // Calcula a bounding box com padding para seleção. É usado por CertificadoCanvas e handleMouseDown
  const getBoxRect = (x, y, width, height) => {
    
    return {
      x: x - width / 2,
      y: y,
      w: width ,
      h: height
    };
  };

  // Detecta clique dentro da caixa de seleção
  const isInsideRect = (mouseX, mouseY, box) => {
    return (
      mouseX >= box.x &&
      mouseX <= box.x + box.w &&
      mouseY >= box.y &&
      mouseY <= box.y + box.h
    );
  };

  // Calcula largura e altura real do texto com quebra de linha 
  // Se comunica com CertificadoCanvas
 const getTextBoxSize = (ctx, text, fontSize, fontFamily, maxWidth) => {
  ctx.font = `${fontSize}px "${fontFamily}", sans-serif`;

  const words = text.split(" ");

  let line = "";
  let lines = [];

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const width = ctx.measureText(testLine).width;

    if (width > maxWidth && line !== "") {
      lines.push(line);
      line = words[i] + " ";
    } else {
      line = testLine;
    }
  }

  lines.push(line);

  const lineHeight = fontSize * 1.2;

  const paddingX = 30;
  const paddingY = 20;

  const width = Math.min(
    Math.max(...lines.map(l => ctx.measureText(l).width)),
    maxWidth
  );

  return {
    width: width + paddingX * 2,
    height: lines.length * lineHeight + paddingY * 2,
  };
};

const textBoxCache = new Map();

function getCachedTextBox(ctx, text, size, font, maxWidth) {
  const key = text + size + font + maxWidth;

  if (textBoxCache.has(key)) {
    return textBoxCache.get(key);
  }

  const result = getTextBoxSize(ctx, text, size, font, maxWidth);
  textBoxCache.set(key, result);

  return result;
}

  // Controla clique no canvas (resize, drag ou seleção)
  // Se comunica com:
  // - isOnHandle()
  // - isInsideRect()
  // - getTextBoxSize()
  // - getBoxRect()
  // - estados de drag 
   const handleMouseDown = (e) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const idx = indexEditando !== null ? indexEditando : 0;
    const itemAlvo = nomesLista[idx] || { nome: "", overrides: {} };

    const nomeTexto = itemAlvo.nome || "Nome do Participante";
    const corpoTexto =
      itemAlvo.overrides?.textoCorpo ||
      textoCorpoBase ||
      "Participou com êxito do evento [Nome do Evento], realizado no dia [Data], com carga horária de [X] horas.";

    // usa ctx real (NÃO cria canvas novo)
    const ctx = canvas.getContext("2d");

    const nomeBox = getCachedTextBox(
      ctx,
      nomeTexto,
      tamanhoNome,
      fonteNome,
      canvas.width * 0.85
    );

    const nomeRect = getBoxRect(
      posicaoNome.x,
      posicaoNome.y,
      nomeBox.width,
      nomeBox.height
    );

    const corpoBox = getCachedTextBox(
      ctx,
      corpoTexto,
      tamanhoCorpo,
      fonteCorpo,
      canvas.width * 0.8
    );

    const corpoRect = getBoxRect(
      posicaoCorpo.x,
      posicaoCorpo.y,
      corpoBox.width,
      corpoBox.height
    );

    // DETECÇÃO DE CLIQUE (SEM STATE PESADO NO INÍCIO)
    if (isInsideRect(mouseX, mouseY, nomeRect)) {
      itemArrastadoRef.current = "nome";
      hoverRef.current = "nome";
      isDraggingRef.current = true;

      setItemSelecionado("nome"); 
      return;
    }

    if (isInsideRect(mouseX, mouseY, corpoRect)) {
      itemArrastadoRef.current = "corpo";
      hoverRef.current = "corpo";
      isDraggingRef.current = true;

      setItemSelecionado("corpo");
      return;
    }

    // click fora
    itemArrastadoRef.current = null;
    isDraggingRef.current = false;

    setItemSelecionado(null);
  };

  // Controla hover, drag e resize
   const handleMouseMove = (e) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let mouseX = (e.clientX - rect.left) * scaleX;
    let mouseY = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext("2d");

    const idx = indexEditando !== null ? indexEditando : 0;
    const itemAlvo = nomesLista[idx] || { nome: "", overrides: {} };

    const nomeTexto = itemAlvo.nome || "Nome do Participante";
    const corpoTexto =
      itemAlvo.overrides?.textoCorpo ||
      textoCorpoBase ||
      "Participou com êxito do evento [Nome do Evento], realizado no dia [Data], com carga horária de [X] horas.";

    const nomeBox = getCachedTextBox(
      ctx,
      nomeTexto,
      tamanhoNome,
      fonteNome,
      canvas.width * 0.85
    );

    const corpoBox = getCachedTextBox(
      ctx,
      corpoTexto,
      tamanhoCorpo,
      fonteCorpo,
      canvas.width * 0.8
    );

    const nomeRect = getBoxRect(
      posicaoNome.x,
      posicaoNome.y,
      nomeBox.width,
      nomeBox.height
    );

    const corpoRect = getBoxRect(
      posicaoCorpo.x,
      posicaoCorpo.y,
      corpoBox.width,
      corpoBox.height
    );

    // HOVER (SEM STATE)
  if (!isDraggingRef.current) {
      const sobreCorpo = isInsideRect(mouseX, mouseY, corpoRect);
      const sobreNome = isInsideRect(mouseX, mouseY, nomeRect);

      if (sobreCorpo) {
        hoverRef.current = "corpo";
        if (itemHover !== "corpo") setItemHover("corpo"); 
      } else if (sobreNome) {
        hoverRef.current = "nome";
        if (itemHover !== "nome") setItemHover("nome");   
      } else {
        hoverRef.current = null;
        if (itemHover !== null) setItemHover(null);       
      }
    }

    // DRAG (REF, NÃO STATE)
    if (!isDraggingRef.current) return;

    const centroX = canvas.width / 2;
    const margemMagnetismo = 40;

    if (Math.abs(mouseX - centroX) < margemMagnetismo) {
      mouseX = centroX;
    }

    const item = itemArrastadoRef.current;

    if (item === "nome") {
      setPosicaoNome({ x: mouseX, y: mouseY });
    } else if (item === "corpo") {
      setPosicaoCorpo({ x: mouseX, y: mouseY });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    itemArrastadoRef.current = null;
  };  

  // Função compartilhada para gerar a imagem no canvas temporário igualzinho ao editor
  // Adicionamos o parâmetro 'textoIndividual' aqui
  const renderizarCertificadoParaDownload = (ctx, img, nome, textoIndividual, larguraCanvas) => {
    ctx.clearRect(0, 0, larguraCanvas, img.height);
    ctx.drawImage(img, 0, 0);

    ctx.textAlign = "center";
    ctx.textBaseline = "top"; 

    // --- 1. DESENHAR O NOME ---
    ctx.font = `${tamanhoNome}px "${fonteNome}", sans-serif`;
    ctx.fillStyle = corNome;

    const nomeBox = getTextBoxSize(ctx, nome, tamanhoNome, fonteNome, larguraCanvas * 0.85);
    const alturaLinhaNome = tamanhoNome * 1.2;

    drawWrappedText(
      ctx,
      nome,
      posicaoNome.x,
      posicaoNome.y,
      nomeBox.width,
      alturaLinhaNome,
      false
    );

    // --- 2. DESENHAR O CORPO ---
    // MUDANÇA AQUI: Usamos 'textoIndividual' em vez de 'textoCorpoBase'
    ctx.font = `${tamanhoCorpo}px "${fonteCorpo}", sans-serif`;
    ctx.fillStyle = corCorpo;

    const corpoBox = getTextBoxSize(ctx, textoIndividual, tamanhoCorpo, fonteCorpo, larguraCanvas * 0.8);
    const alturaLinhaCorpo = tamanhoCorpo * 1.2;

    drawWrappedText(
      ctx, 
      textoIndividual, // <-- Aqui usamos o texto que foi passado
      posicaoCorpo.x, 
      posicaoCorpo.y,
      corpoBox.width, 
      alturaLinhaCorpo,
      true
    );
  };

  // controle de tempo para dar pausas estratégicas durante a geração dos arquivos e melhorar a experiência do usuário com mensagens de status e barra de progresso
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  // 1
  // Gera um PDF com todos os certificados
  const handleDownloadPDF = async () => {
    if (nomesValidos.length === 0) return alert("Insira nomes na lista!");
    if (textoCorpoBase.trim() === "") return alert("Insira um texto para o certificado!");

    // Ativa o carregamento logo no início
    setEstaGerando(true);
    setProgresso(5);
    setMensagemStatus("Preparando o arquivo PDF...");
    await sleep(600); // Pausa para o usuário ler a mensagem antes de começar a gerar 

      try {
        const img = await preloadCertificateImage();

        setMensagemStatus("Carregando fontes e estilos...");
        setProgresso(15);
        await sleep(600);
        // Garante o carregamento das fontes antes de começar
        await document.fonts.load(`${tamanhoNome}px "${fonteNome}"`);
        await document.fonts.load(`${tamanhoCorpo}px "${fonteCorpo}"`);

        const orientation = img.width > img.height ? "l" : "p"; 

        const pdf = new jsPDF({
          orientation: orientation,
          unit: "px",
          format: [img.width, img.height],
          compress: true 
        });

        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;

        for (let i = 0; i < nomesValidos.length; i++) {
          const item = nomesValidos[i];
          const nomeParaDownload = item.nome;
          const textoParaDownload = item.overrides?.textoCorpo || textoCorpoBase;

          const p = Math.round(20 + ((i + 1) / nomesValidos.length) * 70);
          setProgresso(p);
          setMensagemStatus(`Desenhando certificado ${i + 1} de ${nomesValidos.length}...`);
          
          // Renderiza no canvas
          renderizarCertificadoParaDownload(ctx, img, nomeParaDownload, textoParaDownload, tempCanvas.width);

          const imgData = tempCanvas.toDataURL("image/jpeg", 0.75); // JPEG com qualidade para reduzir tamanho do PDF
          
          if (i > 0) pdf.addPage([img.width, img.height], orientation);
          pdf.addImage(imgData, "JPEG", 0, 0, img.width, img.height);

          // Se for uma lista gigante, dá um respiro para o navegador a cada 15 certificados
          if (nomesValidos.length > 30 && i % 15 === 0) await sleep(10);
        }

       // Finalização
        await sleep(500);
        setMensagemStatus("Finalizando arquivo e disparando download...");
        setProgresso(95);
        await sleep(800);

        pdf.save("todos-os-certificados.pdf");

        setMensagemStatus("Download concluído!");
        setProgresso(100);
        await sleep(600);

      } catch (error) {
        console.error(error);
        alert("Ocorreu um erro ao gerar o PDF.");
      } finally {
        // Desliga o carregamento aconteça o que acontecer (sucesso ou erro)
        setEstaGerando(false);
        setMensagemStatus("");
      }
  };
  // 2
  // Gera imagens PNG individuais dentro de um ZIP
  const handleDownloadZIP = async () => {
    const zip = new JSZip();
    if (nomesValidos.length === 0) return alert("Insira nomes na lista!");
    if (textoCorpoBase.trim() === "") return alert("Insira um texto para o certificado!");

    setEstaGerando(true);
    setProgresso(5);
    setMensagemStatus("Preparando os arquivos...");
    await sleep(600);

    const img = await preloadCertificateImage();

      try {

        setMensagemStatus("Carregando fontes e estilos...");
        setProgresso(15);
        await sleep(600);

        // Garante o carregamento das fontes antes de começar
        await document.fonts.load(`${tamanhoNome}px "${fonteNome}"`);
        await document.fonts.load(`${tamanhoCorpo}px "${fonteCorpo}"`);

        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;

        for (let i = 0; i < nomesValidos.length; i++) {
          const item = nomesValidos[i]; // item é o objeto {nome, overrides}
          const nomeParaDownload = item.nome;
          const textoParaDownload = item.overrides?.textoCorpo || textoCorpoBase;
          
          const p = Math.round(20 + ((i + 1) / nomesValidos.length) * 70);
          setProgresso(p);

          setMensagemStatus(`Gerando imagens ${i + 1} de ${nomesValidos.length}...`);
          
          renderizarCertificadoParaDownload(ctx, img, nomeParaDownload, textoParaDownload, tempCanvas.width);

          const dataUrl = tempCanvas.toDataURL("image/jpeg", 0.8).split(",")[1];

          zip.file(
            `${nomeParaDownload.replace(/\s+/g, "_")}_${i + 1}.jpg`,
            dataUrl,
            { base64: true }
          );
        }

        await sleep(500);
        setMensagemStatus("Compactando arquivos no ZIP...");
        setProgresso(95);
        await sleep(800);

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "certificados-individuais.zip");

        setMensagemStatus("Download concluído!");
        setProgresso(100);
        await sleep(500);

      } catch (error) {
        console.error(error);
        alert("Ocorreu um erro ao gerar os certificados.");
      } finally {
        //Desliga o carregamento independente se deu certo ou errado!
        setEstaGerando(false);
        setMensagemStatus("");
      }
    
  };
  //3
  // Gera um ZIP contendo vários arquivos PDF individuais
  const handleDownloadPDFZIP = async () => {
    if (nomesValidos.length === 0) return alert("Insira nomes na lista!");
    if (textoCorpoBase.trim() === "") return alert("Insira um texto para o certificado!");
    
    // 1. Ativa o carregamento
    setEstaGerando(true);
    setProgresso(5);
    setMensagemStatus("Preparando os arquivos...");
    await sleep(600); // Pausa para o usuário ler o início da mensagem antes de começar a gerar 

      try {
        const img = await preloadCertificateImage();
        setMensagemStatus("Carregando fontes e estilos...");
        setProgresso(15);
        await sleep(600); // Pausa para a etapa de fontes

        await document.fonts.load(`${tamanhoNome}px "${fonteNome}"`);
        await document.fonts.load(`${tamanhoCorpo}px "${fonteCorpo}"`);

        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;

        const orientation = img.width > img.height ? "l" : "p";
        const zip = new JSZip();

        for (let i = 0; i < nomesValidos.length; i++) {
          const item = nomesValidos[i]; 
          const nomeParaDownload = item.nome; // String do nome
          const textoParaDownload = item.overrides?.textoCorpo || textoCorpoBase;

          const p = Math.round(20 + ((i + 1) / nomesValidos.length) * 70);
          setProgresso(p);
          
          // 2. Atualiza a mensagem para o usuário ver o progresso real!
          setMensagemStatus(`Gerando PDF ${i + 1} de ${nomesValidos.length}...`);

          renderizarCertificadoParaDownload(ctx, img,  nomeParaDownload, textoParaDownload, tempCanvas.width);

          const imgData = tempCanvas.toDataURL("image/jpeg", 0.75);
          const pdf = new jsPDF({
            orientation,
            unit: "px",
            format: [img.width, img.height],
            compress: true
          });
          pdf.addImage(imgData, "JPEG", 0, 0, img.width, img.height);

          const pdfBlob = pdf.output("blob");
          zip.file(`${nomeParaDownload.replace(/\s+/g, "_")}_${i + 1}.pdf`, pdfBlob);
        }
        
        await sleep(500);
        setMensagemStatus("Compactando arquivos no ZIP...");
        setProgresso(95);
        await sleep(800);

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "certificados-pdf-separados.zip");

        setMensagemStatus("Download concluído!");
        setProgresso(100);
        await sleep(500);

      } catch (error) {
        console.error(error);
        alert("Ocorreu um erro ao gerar os certificados.");
      } finally {
        // Desliga o carregamento independente se deu certo ou errado!
        setEstaGerando(false);
        setMensagemStatus("");
      }
  };

  const handleSaveProject = async () => {
    if (!user || !certificate) return;

    // GARANTIA: Limpa a lista para garantir que é um Array de Objetos 
    // e remove possíveis campos vazios ou nulos.
    const nomesParaSalvar = nomesLista
      .filter(item => item.nome && item.nome.trim() !== "")
      .map(item => ({
        nome: item.nome,
        overrides: item.overrides || {}
    }));

    if (nomesParaSalvar.length === 0) {
      return alert("Insira nomes na lista!");
    }

    try {
      const token = await user.getIdToken();

      const payload = {
        nomesLista: nomesParaSalvar, // Enviamos o array limpo
        textoCorpo,
        estilos: {
          corNome,
          fonteNome,
          tamanhoNome,
          corCorpo,
          fonteCorpo,
          tamanhoCorpo
        },

         posicoes: {
          nome: {
            x: posicaoNome?.x ?? 0,
            y: posicaoNome?.y ?? 0
          },

          corpo: {
            x: posicaoCorpo?.x ?? 0,
            y: posicaoCorpo?.y ?? 0
          }
},

        certificadoId: certificate.id
      };

      // O console.log aqui ajuda a debugar antes do envio:
      console.log("Payload enviado:", payload);

      const url = projectId ? `${API_URL}/projects/${projectId}` : `${API_URL}/projects`;
      const method = projectId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload) // O fetch transforma o objeto em string JSON uma única vez
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar projeto");
      }

      const data = await response.json();

      // salva o id após primeiro POST
      if (!projectId) {
        setProjectId(data.id);
      }

      alert("Projeto salvo com sucesso!");

    } catch (err) {

      console.error(err);
      alert("Erro ao salvar projeto");

    }
  };

  // Lógica de nomes em massa 
  const handleBulkNames = (e) => {
    const value = e.target.value.replace(/\r/g, "");

    setBulkText(value);

    const linhas = value
      .split("\n")
      .map(l => l.trim())
      .filter(l => l !== ""); // remove espaços vazios

    setNomesLista(prev => {
      return linhas.map((nome, i) => ({
        nome,
        overrides: prev[i]?.overrides || {}
      }));
    });
  };;

  if (!certificate) return <p>Carregando certificado...</p>;

  const fonteOptions = [
  {
    label: "Sans-Serif (Modernas)",
    options: [
      { value: "Inter", label: "Inter" },
      { value: "Poppins", label: "Poppins" },
      { value: "Montserrat", label: "Montserrat" },
      { value: "KoHo", label: "KoHo" },
      { value: "Roboto", label: "Roboto" },
      { value: "Raleway", label: "Raleway" },
    ]
  },
  {
    label: "Serif (Elegantes)",
    options: [
      { value: "Cinzel", label: "Cinzel" },
      { value: "Playfair Display", label: "Playfair Display" },
      { value: "Libre Baskerville", label: "Libre Baskerville" },
      { value: "Lora", label: "Lora" },
      { value: "Merriweather", label: "Merriweather" },
      { value: "Cormorant Garamond", label: "Cormorant Garamond" },
      { value: "EB Garamond", label: "EB Garamond" },
    ]
  }
];

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    background: state.isFocused ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)',
    borderColor: state.isFocused ? '#7dd3fc' : 'rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '2px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': { 
      background: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.2)', 
    }
  }),
  menu: (provided) => ({
    ...provided,
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
    color: state.isFocused ? '#fff' : '#94a3b8',
    cursor: 'pointer',
    padding: '10px 15px'
  }),
  singleValue: (provided) => ({ ...provided, color: 'white' }),
  groupHeading: (provided) => ({
    ...provided,
    color: '#38bdf8',
    fontSize: '0.7rem',
    textTransform: 'uppercase'
  })
};

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

      <main className="editor-workspace bulk-scroll">
      {(nomesValidos.length > 0 ? nomesValidos : [{ nome: "", overrides: {} }])
        .slice(0, 50)
        .map((item, index) => {
          
          // Se o item individual tiver um texto próprio no 'overrides', usa ele.
          // Caso contrário, usa o 'textoCorpoBase' que vem da sidebar (global).
          const textoFinal = item.overrides?.textoCorpo || textoCorpoBase;

          return (
            <div 
              key={index} 
              className={`canvas-wrapper ${indexEditando === index ? 'editando-este' : ''}`}
            >
              <button 
                className={`btn-editar-individual ${indexEditando === index ? 'active' : ''}`}
                onClick={() => setIndexEditando(indexEditando === index ? null : index)}
              >
                {indexEditando === index ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                    <span>Sair da Edição</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <span>Texto Individual</span>
                  </>
                )}
              </button>

              <CertificadoCanvas
                certificate={certificate}
                nome={item.nome} 
                textoCorpo={textoFinal} 
                corNome={corNome}        
                corCorpo={corCorpo}
                fonteNome={fonteNome}
                fonteCorpo={fonteCorpo}
                tamanhoNome={tamanhoNome}
                tamanhoCorpo={tamanhoCorpo}
                posicaoNome={posicaoNome}
                posicaoCorpo={posicaoCorpo}
                isDragging={isDraggingRef.current}
                itemHover={itemHover}       
                itemArrastado={itemArrastadoRef.current}
                itemSelecionado={itemSelecionado}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                getBoxRect={getBoxRect}
                getTextBoxSize={getTextBoxSize}
              />
              
              {/* Feedback visual rápido para o usuário */}
              {item.overrides?.textoCorpo && indexEditando !== index && (
                <span className="badge-custom-text">
                  Este certificado possui um texto personalizado.
                </span>
              )}
            </div>
          );
        })}
      </main>

      <aside className="editor-sidebar">

        {nomesLista.length > 20 && (
          <div className="limit-warning">
            Mostrando apenas os primeiros 20 certificados para pré-visualização.
          </div>
        )}

        <div className="control-group">
          <label>Lista de Nomes (Um por linha)</label>
          <textarea
            className="editor-input bulk-area"
            placeholder="Cole aqui a lista de nomes...&#10;Aperte Enter para cada novo nome"
            value={bulkText}
            onChange={handleBulkNames}
          />
        </div>

        <div className="control-group">
          <label className="label-dinamico">
            {indexEditando !== null 
              ? `Texto para: ${nomesLista[indexEditando]?.nome}` 
              : "Texto do Certificado (Global)"}
          </label>
          <textarea
            className={`editor-input bulk-area ${indexEditando !== null ? 'input-individual' : ''}`}
            placeholder="Ex: participou do evento realizado em..."
            value={indexEditando !== null 
              ? (nomesLista[indexEditando].overrides.textoCorpo || textoCorpo) 
              : textoCorpo}
            
            // função updateStyle para salvar no lugar certo
            onChange={(e) => updateStyle('textoCorpo', e.target.value, setTextoCorpo)}
          />
          {indexEditando !== null && (
            <button 
              onClick={() => setIndexEditando(null)}
              className="btn-voltar-global"
            >
              ← Voltar para edição global
            </button>
          )}
        </div>

        <div className="control-group">
          {itemSelecionado === "nome" && (
            <>
              <label>Cor do Nome</label>
              <input
                type="color"
                className="editor-input input-color-picker"
                value={corNome}
                onChange={(e) => setCorNome(e.target.value)}
              />

              <label>Fonte do Nome</label>
              <Select
                options={fonteOptions}
                styles={customStyles}
                value={fonteOptions.flatMap(g => g.options).find(o => o.value === fonteNome)}
                onChange={(selected) => setFonteNome(selected.value)}
                isSearchable={false}
                placeholder="Selecione uma fonte..."
              />

              <label>Tamanho da Fonte</label>
                <div className="font-size-control">
                  {/* Ícone indicativo de menor */}
                  <span className="size-icon small">A</span>
                  
                  <input
                    type="range"
                    min="20"
                    max="150"
                    value={tamanhoNome}
                    onChange={(e) => setTamanhoNome(Number(e.target.value))}
                    className="font-range-input"
                  />
                  
                  {/* Ícone indicativo de maior */}
                  <span className="size-icon large">A</span>

                  <div className="number-wrapper">
                    <input
                      type="number"
                      min="20"
                      max="150"
                      value={tamanhoNome}
                      onChange={(e) => setTamanhoNome(Number(e.target.value))}
                      className="font-number-input"
                    />
                    <span className="unit">px</span>
                  </div>
                </div>
            </>
          )}

          {itemSelecionado === "corpo" && (
            <>
              <label>Cor do Texto</label>
              <input
                type="color"
                className="editor-input input-color-picker"
                value={corCorpo}
                onChange={(e) => setCorCorpo(e.target.value)}
              />

              <label>Fonte do Texto</label>
              <Select
                options={fonteOptions}
                styles={customStyles}
                value={fonteOptions.flatMap(g => g.options).find(o => o.value === fonteCorpo)}
                onChange={(selected) => setFonteCorpo(selected.value)}
                isSearchable={false}
                placeholder="Selecione uma fonte..."
              />

              <label>Tamanho da Fonte Corpo</label>
              <div className="font-size-control">
                {/* Ícone indicativo de menor */}
                <span className="size-icon small">A</span>
                  
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={tamanhoCorpo}
                  onChange={(e) => setTamanhoCorpo(Number(e.target.value))}
                  className="font-range-input"
                />
                  
                {/* Ícone indicativo de maior */}
                <span className="size-icon large">A</span>
                <div className="number-wrapper">
                  <input
                      type="number"
                      min="20"
                      max="150"
                      value={tamanhoCorpo}
                      onChange={(e) => setTamanhoCorpo(Number(e.target.value))}
                      className="font-number-input"
                  />
                  <span className="unit">px</span>
                </div>
              </div>
            </>
          )}

        </div>

        <div className="download-group-container">
            {/* Menu Dropdown */}
            {menuDownloadAberto && (
              <div className="download-options-menu">
                <button className="option-item" onClick={() => { handleDownloadPDF(); setMenuDownloadAberto(false); }}>
                  <div className="item-text-wrapper">
                    <strong className="item-main-title">PDF Único</strong>
                    <span className="item-sub-desc">Todos os certificados em um só arquivo</span>
                  </div>
                </button>

                <button className="option-item" onClick={() => { handleDownloadPDFZIP(); setMenuDownloadAberto(false); }}>
                  <div className="item-text-wrapper">
                    <strong className="item-main-title">PDFs Individuais (.ZIP)</strong>
                    <span className="item-sub-desc">Cada certificado em seu próprio PDF</span>
                  </div>
                </button>

                <button className="option-item" onClick={() => { handleDownloadZIP(); setMenuDownloadAberto(false); }}>
                  <div className="item-text-wrapper">
                    <strong className="item-main-title">Imagens JPEG (.ZIP)</strong>
                    <span className="item-sub-desc">Fotos individuais de cada certificado</span>
                  </div>
                </button>
              </div>
            )}

            {/* Botão Principal */}
          <button 
              className="btn-download-trigger" 
              onClick={() => setMenuDownloadAberto(!menuDownloadAberto)}
          >
            <span>Baixar Certificados</span>
            <span className={`chevron ${menuDownloadAberto ? 'up' : 'down'}`}></span>
          </button>
        </div>

        <div className="save-group-container">
          <button 
            className="btn-save"
            onClick={handleSaveProject}
          >
            <span className="save-icon">💾</span>
            <span>Salvar Projeto</span>
          </button>
        </div>

      </aside>
    </div>
    {/* TELA DE CARREGAMENTO (OVERLAY) */}
    {estaGerando && (
        <div className="loading-overlay">
          <div className="loading-modal">
            <h3>{mensagemStatus}</h3>
            
            {/* Container da Barra */}
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${progresso}%` }}
              ></div>
            </div>
            
            <span className="progress-percentage">{progresso}%</span>
            <p className="warning-text">Aguarde, processando certificados...</p>
          </div>
        </div>
      )}
  </div>
);
};

export default Editor;