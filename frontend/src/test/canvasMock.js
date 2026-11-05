import { vi } from "vitest";

export const CHAR_WIDTH = 10;

/**
 * Contexto 2D falso: cada caractere mede CHAR_WIDTH px, o que torna
 * a quebra de linha determinística nos testes.
 */
export const createMockContext = () => {
  const ctx = {
    font: "",
    fillStyle: "",
    strokeStyle: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    measureText: vi.fn((text) => ({ width: String(text).length * CHAR_WIDTH })),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    roundRect: vi.fn(),
    setLineDash: vi.fn(),
    setTransform: vi.fn(),
    scale: vi.fn(),
  };

  return ctx;
};

/**
 * Substitui getContext/toDataURL/toBlob de todos os canvas do jsdom.
 * Retorna os contextos criados, na ordem.
 */
export const installCanvasMock = () => {
  const contexts = [];

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    function getContext() {
      if (!this.__mockContext) {
        this.__mockContext = createMockContext();
        contexts.push(this.__mockContext);
      }
      return this.__mockContext;
    }
  );

  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(
    () => "data:image/jpeg;base64,QUJD"
  );

  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
    function toBlob(callback, type = "image/png") {
      setTimeout(() => callback(new Blob(["ABC"], { type })), 0);
    }
  );

  return contexts;
};
