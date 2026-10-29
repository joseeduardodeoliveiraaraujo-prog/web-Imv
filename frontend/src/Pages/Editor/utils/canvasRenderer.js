import { drawWrappedText, getTextBoxSize } from "./canvasText";

export const renderCertificateForExport = (
  ctx,
  img,
  name,
  bodyText,
  canvasWidth,
  styles,
  positions
) => {
  ctx.clearRect(0, 0, canvasWidth, img.height);
  ctx.drawImage(img, 0, 0);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  ctx.font = `${styles.tamanhoNome}px "${styles.fonteNome}", sans-serif`;
  ctx.fillStyle = styles.corNome;

  const nameBox = getTextBoxSize(
    ctx,
    name,
    styles.tamanhoNome,
    styles.fonteNome,
    canvasWidth * 0.85
  );
  const nameLineHeight = styles.tamanhoNome * 1.2;

  drawWrappedText(
    ctx,
    name,
    positions.nome.x,
    positions.nome.y,
    nameBox.width,
    nameLineHeight,
    false
  );

  ctx.font = `${styles.tamanhoCorpo}px "${styles.fonteCorpo}", sans-serif`;
  ctx.fillStyle = styles.corCorpo;

  const bodyBox = getTextBoxSize(
    ctx,
    bodyText,
    styles.tamanhoCorpo,
    styles.fonteCorpo,
    canvasWidth * 0.8
  );
  const bodyLineHeight = styles.tamanhoCorpo * 1.2;

  drawWrappedText(
    ctx,
    bodyText,
    positions.corpo.x,
    positions.corpo.y,
    bodyBox.width,
    bodyLineHeight,
    true
  );
};
