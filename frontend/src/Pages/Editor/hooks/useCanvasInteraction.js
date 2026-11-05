import { useCallback, useEffect, useRef, useState } from "react";
import { snapToCenter } from "../utils/certificatePreview";

/**
 * Estado de seleção/hover/arraste compartilhado pelos canvases de pré-visualização.
 * Cada canvas faz o próprio hit test (com o seu texto) e chama estas ações
 * com coordenadas em pixels da imagem.
 */
export const useCanvasInteraction = ({ setPosicaoNome, setPosicaoCorpo }) => {
  const [itemHover, setItemHover] = useState(null);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef(null);
  const pendingRef = useRef(null);
  const frameRef = useRef(null);

  const setterFor = useCallback(
    (item) => (item === "nome" ? setPosicaoNome : setPosicaoCorpo),
    [setPosicaoNome, setPosicaoCorpo]
  );

  const flush = useCallback(() => {
    frameRef.current = null;
    const pending = pendingRef.current;
    if (!pending) return;

    pendingRef.current = null;
    setterFor(pending.item)({ x: pending.x, y: pending.y });
  }, [setterFor]);

  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    []
  );

  const hover = useCallback((item) => {
    if (dragRef.current) return;
    setItemHover((current) => (current === item ? current : item));
  }, []);

  const select = useCallback((item) => {
    setItemSelecionado(item);
  }, []);

  const startDrag = useCallback((item, point, position) => {
    dragRef.current = {
      item,
      offsetX: position.x - point.x,
      offsetY: position.y - point.y,
    };
    setItemSelecionado(item);
    setItemHover(item);
    setIsDragging(true);
  }, []);

  const isDragActive = useCallback(() => dragRef.current !== null, []);

  const dragTo = useCallback(
    (point, imageWidth) => {
      const drag = dragRef.current;
      if (!drag) return;

      pendingRef.current = {
        item: drag.item,
        x: snapToCenter(point.x + drag.offsetX, imageWidth),
        y: point.y + drag.offsetY,
      };

      if (!frameRef.current) {
        frameRef.current = requestAnimationFrame(flush);
      }
    },
    [flush]
  );

  const endDrag = useCallback(() => {
    if (!dragRef.current) return;

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    flush();

    dragRef.current = null;
    setIsDragging(false);
  }, [flush]);

  const nudge = useCallback(
    (dx, dy) => {
      if (!itemSelecionado) return;
      setterFor(itemSelecionado)((current) => ({
        x: current.x + dx,
        y: current.y + dy,
      }));
    },
    [itemSelecionado, setterFor]
  );

  return {
    itemHover,
    itemSelecionado,
    isDragging,
    hover,
    select,
    startDrag,
    isDragActive,
    dragTo,
    endDrag,
    nudge,
  };
};
