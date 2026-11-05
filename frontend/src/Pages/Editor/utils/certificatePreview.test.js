import { describe, expect, it } from "vitest";
import { CHAR_WIDTH, createMockContext } from "../../../test/canvasMock";
import { DEFAULT_STYLES } from "../constants/editor";
import {
  MAGNET_DISTANCE,
  drawPreview,
  getPreviewScale,
  getTextRects,
  hitTestText,
  snapToCenter,
} from "./certificatePreview";

describe("getPreviewScale", () => {
  it("não amplia imagens menores que a área de exibição", () => {
    expect(getPreviewScale(800, 1)).toBe(1);
  });

  it("reduz para a largura de exibição considerando a densidade de pixels", () => {
    expect(getPreviewScale(3680, 1)).toBeCloseTo(920 / 3680);
    expect(getPreviewScale(3680, 2)).toBeCloseTo(1840 / 3680);
  });

  it("limita a densidade a 2x", () => {
    expect(getPreviewScale(3680, 3)).toBeCloseTo(1840 / 3680);
  });
});

describe("hit test", () => {
  const ctx = createMockContext();
  const base = {
    ctx,
    imageWidth: 2000,
    corpoTexto: "corpo",
    styles: { ...DEFAULT_STYLES, tamanhoNome: 40, tamanhoCorpo: 20 },
    posicaoNome: { x: 1000, y: 100 },
    posicaoCorpo: { x: 1000, y: 400 },
  };

  it("usa o texto de cada certificado: nome longo tem área maior", () => {
    const shortRects = getTextRects({ ...base, nomeTexto: "Ana" });
    const longRects = getTextRects({ ...base, nomeTexto: "Maria Aparecida dos Santos" });

    // Ponto perto do fim do nome longo, fora da área do nome curto.
    const point = { x: longRects.nome.x + longRects.nome.w - 5, y: 120 };

    expect(hitTestText(point, longRects)).toBe("nome");
    expect(hitTestText(point, shortRects)).toBeNull();
    expect(longRects.nome.w).toBeGreaterThan(shortRects.nome.w + 10 * CHAR_WIDTH);
  });

  it("detecta o corpo e respeita a prioridade quando as áreas se sobrepõem", () => {
    const rects = {
      nome: { x: 0, y: 0, w: 100, h: 100 },
      corpo: { x: 50, y: 50, w: 100, h: 100 },
    };

    expect(hitTestText({ x: 75, y: 75 }, rects, "nome")).toBe("nome");
    expect(hitTestText({ x: 75, y: 75 }, rects, "corpo")).toBe("corpo");
    expect(hitTestText({ x: 140, y: 140 }, rects)).toBe("corpo");
    expect(hitTestText({ x: 500, y: 500 }, rects)).toBeNull();
  });
});

describe("snapToCenter", () => {
  it("encaixa no centro dentro da distância magnética", () => {
    expect(snapToCenter(1000 + MAGNET_DISTANCE - 1, 2000)).toBe(1000);
    expect(snapToCenter(1000 + MAGNET_DISTANCE + 1, 2000)).toBe(1041);
  });
});

describe("drawPreview", () => {
  const draw = (canvas, ctx, overrides = {}) =>
    drawPreview({
      canvas,
      ctx,
      img: { width: 2000, height: 1000 },
      scale: 0.5,
      nomeTexto: "Ana",
      corpoTexto: "Texto",
      styles: DEFAULT_STYLES,
      posicaoNome: { x: 500, y: 100 },
      posicaoCorpo: { x: 500, y: 300 },
      isDragging: false,
      itemHover: null,
      itemSelecionado: null,
      ...overrides,
    });

  it("desenha em resolução reduzida com transformação de escala", () => {
    const ctx = createMockContext();
    const canvas = { width: 0, height: 0 };

    draw(canvas, ctx);

    expect(canvas.width).toBe(1000);
    expect(canvas.height).toBe(500);
    expect(ctx.setTransform).toHaveBeenCalledWith(0.5, 0, 0, 0.5, 0, 0);
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 2000, 1000);
  });

  it("não redefine width/height quando o tamanho não muda", () => {
    const ctx = createMockContext();
    let widthWrites = 0;
    let width = 1000;
    const canvas = {
      height: 500,
      get width() {
        return width;
      },
      set width(value) {
        widthWrites += 1;
        width = value;
      },
    };

    draw(canvas, ctx);
    draw(canvas, ctx);

    expect(widthWrites).toBe(0);
  });

  it("mostra a guia central apenas durante o arraste com o texto no centro", () => {
    const ctx = createMockContext();
    const canvas = { width: 0, height: 0 };

    draw(canvas, ctx, { isDragging: true, posicaoNome: { x: 1000, y: 100 } });
    expect(ctx.setLineDash).toHaveBeenCalled();

    const idle = createMockContext();
    draw(canvas, idle, { isDragging: false, posicaoNome: { x: 1000, y: 100 } });
    expect(idle.setLineDash).not.toHaveBeenCalled();
  });

  it("desenha alças apenas no item selecionado", () => {
    const ctx = createMockContext();
    draw({ width: 0, height: 0 }, ctx, { itemSelecionado: "nome", itemHover: "corpo" });

    // 4 alças (arc) do item selecionado; o hover só desenha o contorno.
    expect(ctx.arc).toHaveBeenCalledTimes(4);
    expect(ctx.roundRect).toHaveBeenCalledTimes(2);
  });
});
