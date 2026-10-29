import { useEffect, useRef } from "react";
import { DEFAULT_BODY_TEXT, DEFAULT_NAME_TEXT } from "../constants/editor";
import { getBoxRect } from "../utils/canvasGeometry";
import { drawWrappedText, getTextBoxSize } from "../utils/canvasText";

const CertificateCanvas = ({
  certificate,
  nome,
  textoCorpo,
  corNome,
  corCorpo,
  fonteNome,
  fonteCorpo,
  tamanhoNome,
  tamanhoCorpo,
  posicaoNome,
  posicaoCorpo,
  isDragging,
  itemHover,
  itemArrastado,
  itemSelecionado,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}) => {
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

      const nomeParaDesenho = nome && nome.length > 0 ? nome : DEFAULT_NAME_TEXT;
      const corpoParaDesenho =
        textoCorpo && textoCorpo.length > 0 ? textoCorpo : DEFAULT_BODY_TEXT;

      const centroCanvas = canvas.width / 2;
      const margemErro = 5;

      const nomeNoCentro = Math.abs(posicaoNome.x - centroCanvas) <= margemErro;
      const corpoNoCentro =
        Math.abs(posicaoCorpo.x - centroCanvas) <= margemErro;

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

      ctx.font = `${tamanhoNome}px "${fonteNome}", sans-serif`;
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      ctx.fillStyle = corNome;

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

      const drawSelectionBox = (x, y, width, height, showHandles = false) => {
        ctx.save();

        const azulCanva = "#00c4cc";
        const raioCanto = 8;
        const box = getBoxRect(x, y, width, height);

        const rectX = box.x;
        const rectY = box.y;
        const rectW = box.w;
        const rectH = box.h;

        ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        ctx.roundRect(rectX, rectY, rectW, rectH, raioCanto);
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
        drawSelectionBox(
          posicaoNome.x,
          posicaoNome.y,
          nomeBox.width,
          alturaTotalNome,
          false
        );
      }

      if (itemSelecionado === "nome") {
        drawSelectionBox(
          posicaoNome.x,
          posicaoNome.y,
          nomeBox.width,
          alturaTotalNome,
          true
        );
      }

      if (itemHover === "corpo" && itemSelecionado !== "corpo") {
        drawSelectionBox(
          posicaoCorpo.x,
          posicaoCorpo.y,
          corpoBox.width,
          alturaTotalCorpo,
          false
        );
      }

      if (itemSelecionado === "corpo") {
        drawSelectionBox(
          posicaoCorpo.x,
          posicaoCorpo.y,
          corpoBox.width,
          alturaTotalCorpo,
          true
        );
      }
    };
  }, [
    certificate,
    nome,
    textoCorpo,
    corNome,
    corCorpo,
    posicaoNome,
    posicaoCorpo,
    fonteNome,
    fonteCorpo,
    tamanhoNome,
    tamanhoCorpo,
    isDragging,
    itemHover,
    itemArrastado,
    itemSelecionado,
  ]);

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

export default CertificateCanvas;
