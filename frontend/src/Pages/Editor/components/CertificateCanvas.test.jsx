import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { installCanvasMock } from "../../../test/canvasMock";
import { DEFAULT_STYLES } from "../constants/editor";
import { createTextBoxMeasurer } from "../utils/canvasText";
import CertificateCanvas from "./CertificateCanvas";

const IMAGE = { width: 2000, height: 1000 };

vi.mock("../utils/loadImage", () => ({
  getLoadedImage: () => IMAGE,
  loadImage: async () => IMAGE,
}));

vi.mock("../utils/loadEditorFonts", () => ({
  areFontsReady: () => true,
  loadSelectedFonts: async () => {},
}));

const makeInteraction = (overrides = {}) => ({
  itemHover: null,
  itemSelecionado: null,
  isDragging: false,
  hover: vi.fn(),
  select: vi.fn(),
  startDrag: vi.fn(),
  isDragActive: vi.fn(() => false),
  dragTo: vi.fn(),
  endDrag: vi.fn(),
  nudge: vi.fn(),
  ...overrides,
});

const renderCanvas = ({ nome, interaction }) => {
  render(
    <CertificateCanvas
      imageUrl="https://cdn/modelo.png"
      nome={nome}
      textoCorpo="Texto"
      styles={{ ...DEFAULT_STYLES, tamanhoNome: 40, tamanhoCorpo: 20 }}
      posicaoNome={{ x: 1000, y: 100 }}
      posicaoCorpo={{ x: 1000, y: 600 }}
      interaction={interaction}
      measure={createTextBoxMeasurer()}
      label={`Certificado de ${nome}`}
    />
  );

  const canvas = screen.getByLabelText(`Certificado de ${nome}`);
  // Exibido em 1000x500: cada pixel na tela equivale a 2 pixels da imagem.
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 500 });
  return canvas;
};

describe("CertificateCanvas", () => {
  beforeEach(() => {
    installCanvasMock();
  });

  it("desenha em resolução de exibição, não na resolução da imagem", () => {
    const canvas = renderCanvas({ nome: "Ana", interaction: makeInteraction() });

    expect(canvas.width).toBeLessThanOrEqual(1840);
    expect(canvas.width).toBeLessThan(IMAGE.width);
  });

  it("usa o texto deste certificado no hit test (nome longo)", () => {
    const interaction = makeInteraction();
    const canvas = renderCanvas({ nome: "Maria Aparecida dos Santos", interaction });

    // x=575 na tela => 1150 na imagem: dentro do nome longo, fora de um nome curto.
    fireEvent.pointerDown(canvas, { clientX: 575, clientY: 60, pointerType: "mouse", button: 0 });

    expect(interaction.startDrag).toHaveBeenCalledWith(
      "nome",
      { x: 1150, y: 120 },
      { x: 1000, y: 100 }
    );
  });

  it("o mesmo ponto não seleciona nada em um certificado de nome curto", () => {
    const interaction = makeInteraction();
    const canvas = renderCanvas({ nome: "Ana", interaction });

    fireEvent.pointerDown(canvas, { clientX: 575, clientY: 60, pointerType: "mouse", button: 0 });

    expect(interaction.startDrag).not.toHaveBeenCalled();
    expect(interaction.select).toHaveBeenCalledWith(null);
  });

  it("encaminha o movimento ao arraste ativo e encerra no pointerup", () => {
    const interaction = makeInteraction({ isDragActive: vi.fn(() => true) });
    const canvas = renderCanvas({ nome: "Ana", interaction });

    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 50, pointerType: "touch" });
    fireEvent.pointerUp(canvas, { pointerType: "touch" });

    expect(interaction.dragTo).toHaveBeenCalledWith({ x: 200, y: 100 }, 2000);
    expect(interaction.endDrag).toHaveBeenCalled();
  });

  it("libera a rolagem por toque até que um texto seja selecionado", () => {
    const free = renderCanvas({ nome: "Ana", interaction: makeInteraction() });
    expect(free.className).not.toContain("is-locked");

    const locked = renderCanvas({
      nome: "Bia",
      interaction: makeInteraction({ itemSelecionado: "nome" }),
    });
    expect(locked.className).toContain("is-locked");
  });

  it("teclado: Enter alterna a seleção e as setas movem o item", () => {
    const none = makeInteraction();
    const canvas = renderCanvas({ nome: "Ana", interaction: none });
    fireEvent.keyDown(canvas, { key: "Enter" });
    expect(none.select).toHaveBeenCalledWith("nome");

    const selected = makeInteraction({ itemSelecionado: "nome" });
    const canvas2 = renderCanvas({ nome: "Bia", interaction: selected });
    fireEvent.keyDown(canvas2, { key: "ArrowRight" });
    fireEvent.keyDown(canvas2, { key: "ArrowUp", shiftKey: true });
    fireEvent.keyDown(canvas2, { key: "Escape" });

    expect(selected.nudge).toHaveBeenNthCalledWith(1, 4, 0);
    expect(selected.nudge).toHaveBeenNthCalledWith(2, 0, -40);
    expect(selected.select).toHaveBeenCalledWith(null);
  });
});
