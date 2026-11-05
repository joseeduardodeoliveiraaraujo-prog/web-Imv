import { describe, expect, it } from "vitest";
import { CHAR_WIDTH, createMockContext } from "../../../test/canvasMock";
import { getBoxRect, isInsideRect } from "./canvasGeometry";
import {
  TEXT_PADDING_X,
  TEXT_PADDING_Y,
  createTextBoxMeasurer,
  drawWrappedText,
  getTextBoxSize,
} from "./canvasText";

describe("canvasGeometry", () => {
  it("getBoxRect centraliza a caixa horizontalmente em x", () => {
    expect(getBoxRect(500, 100, 200, 50)).toEqual({ x: 400, y: 100, w: 200, h: 50 });
  });

  it("isInsideRect inclui as bordas", () => {
    const box = { x: 10, y: 10, w: 100, h: 20 };
    expect(isInsideRect(10, 10, box)).toBe(true);
    expect(isInsideRect(110, 30, box)).toBe(true);
    expect(isInsideRect(111, 30, box)).toBe(false);
    expect(isInsideRect(50, 9, box)).toBe(false);
  });
});

describe("getTextBoxSize", () => {
  it("mede uma linha curta com padding", () => {
    const ctx = createMockContext();
    const box = getTextBoxSize(ctx, "Ana", 40, "Inter", 1000);

    // "Ana " mede 4 caracteres.
    expect(box.width).toBe(4 * CHAR_WIDTH + TEXT_PADDING_X * 2);
    expect(box.height).toBe(40 * 1.2 + TEXT_PADDING_Y * 2);
    expect(ctx.font).toBe('40px "Inter", sans-serif');
  });

  it("quebra em várias linhas e limita a largura ao máximo", () => {
    const ctx = createMockContext();
    const box = getTextBoxSize(ctx, "aaaa bbbb cccc", 10, "Inter", 60);

    expect(box.height).toBe(3 * 10 * 1.2 + TEXT_PADDING_Y * 2);
    expect(box.width).toBeLessThanOrEqual(60 + TEXT_PADDING_X * 2);
  });
});

describe("drawWrappedText", () => {
  it("retorna 0 e não desenha quando não há texto", () => {
    const ctx = createMockContext();
    expect(drawWrappedText(ctx, "", 0, 0, 100, 10)).toBe(0);
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it("desenha cada linha sem justificar quando justify=false", () => {
    const ctx = createMockContext();
    // Largura útil = 200 - 2*30 = 140 => cabem 14 caracteres por linha.
    const height = drawWrappedText(ctx, "aaaaaa bbbbbb cccccc", 100, 0, 200, 12, false);

    expect(ctx.fillText.mock.calls.map(([text]) => text)).toEqual([
      "aaaaaa bbbbbb",
      "cccccc",
    ]);
    expect(height).toBe(2 * 12 + TEXT_PADDING_Y * 2);
  });

  it("justifica palavra a palavra, exceto a última linha", () => {
    const ctx = createMockContext();
    drawWrappedText(ctx, "aaaaaa bbbbbb cccccc", 100, 0, 200, 12, true);

    const drawn = ctx.fillText.mock.calls.map(([text]) => text);
    expect(drawn).toEqual(["aaaaaa", "bbbbbb", "cccccc"]);
  });
});

describe("createTextBoxMeasurer", () => {
  it("reaproveita a medição para os mesmos parâmetros", () => {
    const ctx = createMockContext();
    const measure = createTextBoxMeasurer();

    const first = measure(ctx, "Ana", 40, "Inter", 500);
    const callsAfterFirst = ctx.measureText.mock.calls.length;
    const second = measure(ctx, "Ana", 40, "Inter", 500);

    expect(second).toBe(first);
    expect(ctx.measureText.mock.calls.length).toBe(callsAfterFirst);
  });
});
