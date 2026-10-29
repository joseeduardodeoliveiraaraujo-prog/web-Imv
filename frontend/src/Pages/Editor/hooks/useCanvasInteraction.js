import { useRef, useState } from "react";
import { DEFAULT_BODY_TEXT, DEFAULT_NAME_TEXT } from "../constants/editor";
import { getBoxRect, isInsideRect } from "../utils/canvasGeometry";

export const useCanvasInteraction = ({
  indexEditando,
  nomesLista,
  textoCorpoBase,
  tamanhoNome,
  fonteNome,
  tamanhoCorpo,
  fonteCorpo,
  posicaoNome,
  posicaoCorpo,
  setPosicaoNome,
  setPosicaoCorpo,
  getCachedTextBox,
}) => {
  const isDraggingRef = useRef(false);
  const itemArrastadoRef = useRef(null);
  const hoverRef = useRef(null);
  const [itemHover, setItemHover] = useState(null);
  const [itemSelecionado, setItemSelecionado] = useState(null);

  const handleMouseDown = (event) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    const idx = indexEditando !== null ? indexEditando : 0;
    const itemAlvo = nomesLista[idx] || { nome: "", overrides: {} };

    const nomeTexto = itemAlvo.nome || DEFAULT_NAME_TEXT;
    const corpoTexto =
      itemAlvo.overrides?.textoCorpo ||
      textoCorpoBase ||
      DEFAULT_BODY_TEXT;

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

    itemArrastadoRef.current = null;
    isDraggingRef.current = false;

    setItemSelecionado(null);
  };

  const handleMouseMove = (event) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let mouseX = (event.clientX - rect.left) * scaleX;
    let mouseY = (event.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext("2d");

    const idx = indexEditando !== null ? indexEditando : 0;
    const itemAlvo = nomesLista[idx] || { nome: "", overrides: {} };

    const nomeTexto = itemAlvo.nome || DEFAULT_NAME_TEXT;
    const corpoTexto =
      itemAlvo.overrides?.textoCorpo ||
      textoCorpoBase ||
      DEFAULT_BODY_TEXT;

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

  return {
    isDraggingRef,
    itemArrastadoRef,
    itemHover,
    itemSelecionado,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
