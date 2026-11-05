import { useEffect, useRef } from "react";
import {
  drawPreview,
  getDisplayTexts,
  getPreviewScale,
  getTextRects,
  hitTestText,
} from "../utils/certificatePreview";
import { areFontsReady, loadSelectedFonts } from "../utils/loadEditorFonts";
import { getLoadedImage, loadImage } from "../utils/loadImage";

const NEXT_SELECTION = { none: "nome", nome: "corpo", corpo: null };
const ARROWS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

const CertificateCanvas = ({
  imageUrl,
  nome,
  textoCorpo,
  styles,
  posicaoNome,
  posicaoCorpo,
  interaction,
  measure,
  label,
  describedBy,
}) => {
  const canvasRef = useRef(null);
  const layoutRef = useRef(null);
  const { itemHover, itemSelecionado, isDragging } = interaction;
  const { nomeTexto, corpoTexto } = getDisplayTexts(nome, textoCorpo);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!imageUrl || !canvas) return undefined;

    let isActive = true;

    const paint = (img) => {
      if (!isActive) return;

      const scale = getPreviewScale(img.width);
      layoutRef.current = { imageWidth: img.width, imageHeight: img.height };

      drawPreview({
        canvas,
        ctx: canvas.getContext("2d"),
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
      });
    };

    // Caminho rápido (arraste/digitação): imagem e fontes já prontas, desenho síncrono.
    const img = getLoadedImage(imageUrl);
    if (img && areFontsReady(styles)) {
      paint(img);
      return () => {
        isActive = false;
      };
    }

    Promise.all([loadImage(imageUrl), loadSelectedFonts(styles)])
      .then(([loadedImg]) => paint(loadedImg))
      .catch((error) => {
        console.error("Erro ao carregar imagem do certificado:", error);
      });

    return () => {
      isActive = false;
    };
  }, [
    imageUrl,
    nomeTexto,
    corpoTexto,
    styles,
    posicaoNome,
    posicaoCorpo,
    isDragging,
    itemHover,
    itemSelecionado,
  ]);

  const toImagePoint = (event) => {
    const layout = layoutRef.current;
    if (!layout) return null;

    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    return {
      x: ((event.clientX - rect.left) * layout.imageWidth) / rect.width,
      y: ((event.clientY - rect.top) * layout.imageHeight) / rect.height,
    };
  };

  const hitTest = (point, priority) =>
    hitTestText(
      point,
      getTextRects({
        ctx: canvasRef.current.getContext("2d"),
        measure,
        imageWidth: layoutRef.current.imageWidth,
        nomeTexto,
        corpoTexto,
        styles,
        posicaoNome,
        posicaoCorpo,
      }),
      priority
    );

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const point = toImagePoint(event);
    if (!point) return;

    const item = hitTest(point, "nome");

    if (!item) {
      interaction.select(null);
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    interaction.startDrag(
      item,
      point,
      item === "nome" ? posicaoNome : posicaoCorpo
    );
  };

  const handlePointerMove = (event) => {
    const point = toImagePoint(event);
    if (!point) return;

    if (interaction.isDragActive()) {
      interaction.dragTo(point, layoutRef.current.imageWidth);
      return;
    }

    if (event.pointerType === "mouse") {
      interaction.hover(hitTest(point, "corpo"));
    }
  };

  const handlePointerEnd = (event) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    interaction.endDrag();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      interaction.select(NEXT_SELECTION[itemSelecionado ?? "none"]);
      return;
    }

    if (event.key === "Escape" && itemSelecionado) {
      event.preventDefault();
      interaction.select(null);
      return;
    }

    const direction = ARROWS[event.key];
    if (!direction || !itemSelecionado || !layoutRef.current) return;

    event.preventDefault();
    const baseStep = Math.max(1, Math.round(layoutRef.current.imageWidth / 500));
    const step = event.shiftKey ? baseStep * 10 : baseStep;
    interaction.nudge(direction[0] * step, direction[1] * step);
  };

  const className = [
    "editor-canvas",
    itemSelecionado ? "is-locked" : "",
    isDragging ? "is-dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className={className}
        tabIndex={0}
        aria-label={label}
        aria-describedby={describedBy}
        aria-roledescription="pré-visualização editável"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={() => {
          if (!interaction.isDragActive()) interaction.hover(null);
        }}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default CertificateCanvas;
