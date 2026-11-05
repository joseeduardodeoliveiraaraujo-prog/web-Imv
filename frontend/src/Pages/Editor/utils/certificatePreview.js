import { DEFAULT_BODY_TEXT, DEFAULT_NAME_TEXT } from "../constants/editor";
import { getBoxRect, isInsideRect } from "./canvasGeometry";
import { drawWrappedText, getTextBoxSize } from "./canvasText";

// Largura máxima do canvas na tela (ver .editor-canvas em canvas.css).
export const PREVIEW_MAX_CSS_WIDTH = 920;
const MAX_PIXEL_RATIO = 2;

const NAME_WIDTH_FACTOR = 0.85;
const BODY_WIDTH_FACTOR = 0.8;
export const MAGNET_DISTANCE = 40;
const CENTER_GUIDE_TOLERANCE = 5;

/**
 * A pré-visualização é desenhada na resolução em que aparece na tela
 * (limitada a 2x para telas retina), não na resolução original da imagem.
 * As posições continuam em pixels da imagem: a exportação usa resolução total.
 */
export const getPreviewScale = (
  imageWidth,
  pixelRatio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1
) => {
  const ratio = Math.min(Math.max(pixelRatio, 1), MAX_PIXEL_RATIO);
  return Math.min(1, (PREVIEW_MAX_CSS_WIDTH * ratio) / imageWidth);
};

export const getDisplayTexts = (nome, textoCorpo) => ({
  nomeTexto: nome && nome.length > 0 ? nome : DEFAULT_NAME_TEXT,
  corpoTexto: textoCorpo && textoCorpo.length > 0 ? textoCorpo : DEFAULT_BODY_TEXT,
});

/** Retângulos clicáveis do nome e do corpo, em pixels da imagem. */
export const getTextRects = ({
  ctx,
  measure = getTextBoxSize,
  imageWidth,
  nomeTexto,
  corpoTexto,
  styles,
  posicaoNome,
  posicaoCorpo,
}) => {
  const nomeBox = measure(
    ctx,
    nomeTexto,
    styles.tamanhoNome,
    styles.fonteNome,
    imageWidth * NAME_WIDTH_FACTOR
  );
  const corpoBox = measure(
    ctx,
    corpoTexto,
    styles.tamanhoCorpo,
    styles.fonteCorpo,
    imageWidth * BODY_WIDTH_FACTOR
  );

  return {
    nome: getBoxRect(posicaoNome.x, posicaoNome.y, nomeBox.width, nomeBox.height),
    corpo: getBoxRect(posicaoCorpo.x, posicaoCorpo.y, corpoBox.width, corpoBox.height),
  };
};

/**
 * Qual texto está sob o ponto. No clique o nome tem prioridade;
 * no hover, o corpo (comportamento herdado da versão anterior).
 */
export const hitTestText = (point, rects, priority = "nome") => {
  const order = priority === "nome" ? ["nome", "corpo"] : ["corpo", "nome"];
  return order.find((item) => isInsideRect(point.x, point.y, rects[item])) ?? null;
};

/** Aproxima do centro horizontal quando o texto chega perto dele. */
export const snapToCenter = (x, imageWidth) => {
  const center = imageWidth / 2;
  return Math.abs(x - center) < MAGNET_DISTANCE ? center : x;
};

const drawSelectionBox = (ctx, x, y, width, height, showHandles) => {
  ctx.save();

  const azulCanva = "#00c4cc";
  const box = getBoxRect(x, y, width, height);

  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 8);
  ctx.strokeStyle = azulCanva;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (showHandles) {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = "white";
    ctx.strokeStyle = azulCanva;
    ctx.lineWidth = 2;

    [
      [box.x, box.y],
      [box.x + box.w, box.y],
      [box.x, box.y + box.h],
      [box.x + box.w, box.y + box.h],
    ].forEach(([hx, hy]) => {
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  ctx.restore();
};

/**
 * Desenha um quadro completo da pré-visualização.
 * Redimensiona o canvas apenas quando o tamanho muda (redefinir width/height
 * realoca a memória do canvas a cada chamada).
 */
export const drawPreview = ({
  canvas,
  ctx,
  img,
  scale,
  nomeTexto,
  corpoTexto,
  styles,
  posicaoNome,
  posicaoCorpo,
  isDragging,
  itemHover,
  itemSelecionado,
}) => {
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, img.width, img.height);
  ctx.drawImage(img, 0, 0, img.width, img.height);

  const centro = img.width / 2;
  const nomeNoCentro = Math.abs(posicaoNome.x - centro) <= CENTER_GUIDE_TOLERANCE;
  const corpoNoCentro = Math.abs(posicaoCorpo.x - centro) <= CENTER_GUIDE_TOLERANCE;

  if (isDragging && (nomeNoCentro || corpoNoCentro)) {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([15, 10]);
    ctx.strokeStyle = "#e056fd";
    ctx.lineWidth = 4;
    ctx.moveTo(centro, 0);
    ctx.lineTo(centro, img.height);
    ctx.stroke();
    ctx.restore();
  }

  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  ctx.fillStyle = styles.corNome;
  const nomeBox = getTextBoxSize(
    ctx,
    nomeTexto,
    styles.tamanhoNome,
    styles.fonteNome,
    img.width * NAME_WIDTH_FACTOR
  );
  const alturaNome = drawWrappedText(
    ctx,
    nomeTexto,
    posicaoNome.x,
    posicaoNome.y,
    nomeBox.width,
    styles.tamanhoNome * 1.2,
    false
  );

  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  ctx.fillStyle = styles.corCorpo;
  const corpoBox = getTextBoxSize(
    ctx,
    corpoTexto,
    styles.tamanhoCorpo,
    styles.fonteCorpo,
    img.width * BODY_WIDTH_FACTOR
  );
  const alturaCorpo = drawWrappedText(
    ctx,
    corpoTexto,
    posicaoCorpo.x,
    posicaoCorpo.y,
    corpoBox.width,
    styles.tamanhoCorpo * 1.2,
    true
  );

  const boxes = {
    nome: [posicaoNome.x, posicaoNome.y, nomeBox.width, alturaNome],
    corpo: [posicaoCorpo.x, posicaoCorpo.y, corpoBox.width, alturaCorpo],
  };

  ["nome", "corpo"].forEach((item) => {
    if (itemSelecionado === item) {
      drawSelectionBox(ctx, ...boxes[item], true);
    } else if (itemHover === item) {
      drawSelectionBox(ctx, ...boxes[item], false);
    }
  });
};
