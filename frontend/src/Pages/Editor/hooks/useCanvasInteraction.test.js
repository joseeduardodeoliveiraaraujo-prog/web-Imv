import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCanvasInteraction } from "./useCanvasInteraction";

const setup = () => {
  const positions = {
    nome: { x: 500, y: 100 },
    corpo: { x: 500, y: 400 },
  };
  const makeSetter = (key) =>
    vi.fn((value) => {
      positions[key] = typeof value === "function" ? value(positions[key]) : value;
    });

  const setPosicaoNome = makeSetter("nome");
  const setPosicaoCorpo = makeSetter("corpo");
  const hook = renderHook(() =>
    useCanvasInteraction({ setPosicaoNome, setPosicaoCorpo })
  );

  return { hook, positions, setPosicaoNome, setPosicaoCorpo };
};

describe("useCanvasInteraction", () => {
  let frames;

  beforeEach(() => {
    frames = [];
    vi.stubGlobal("requestAnimationFrame", (callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  const runFrame = () => {
    const pending = frames.splice(0);
    act(() => pending.forEach((callback) => callback()));
  };

  it("aplica no máximo uma atualização de posição por quadro", () => {
    const { hook, setPosicaoNome } = setup();

    act(() => hook.result.current.startDrag("nome", { x: 500, y: 100 }, { x: 500, y: 100 }));
    act(() => {
      hook.result.current.dragTo({ x: 600, y: 150 }, 2000);
      hook.result.current.dragTo({ x: 620, y: 160 }, 2000);
      hook.result.current.dragTo({ x: 640, y: 170 }, 2000);
    });

    expect(frames).toHaveLength(1);
    expect(setPosicaoNome).not.toHaveBeenCalled();

    runFrame();

    expect(setPosicaoNome).toHaveBeenCalledTimes(1);
    expect(setPosicaoNome).toHaveBeenCalledWith({ x: 640, y: 170 });
  });

  it("mantém o ponto onde o texto foi agarrado (sem salto)", () => {
    const { hook, setPosicaoCorpo } = setup();

    // Agarrou 30px à direita e 10px abaixo da âncora do texto.
    act(() => hook.result.current.startDrag("corpo", { x: 530, y: 410 }, { x: 500, y: 400 }));
    act(() => hook.result.current.dragTo({ x: 730, y: 510 }, 2000));
    runFrame();

    expect(setPosicaoCorpo).toHaveBeenCalledWith({ x: 700, y: 500 });
  });

  it("encaixa no centro e aplica a posição pendente ao soltar", () => {
    const { hook, setPosicaoNome } = setup();

    act(() => hook.result.current.startDrag("nome", { x: 500, y: 100 }, { x: 500, y: 100 }));
    act(() => hook.result.current.dragTo({ x: 1020, y: 100 }, 2000));
    act(() => hook.result.current.endDrag());

    expect(setPosicaoNome).toHaveBeenCalledWith({ x: 1000, y: 100 });
    expect(hook.result.current.isDragging).toBe(false);
    expect(hook.result.current.isDragActive()).toBe(false);
  });

  it("seleciona ao arrastar e move o item selecionado pelo teclado", () => {
    const { hook, positions } = setup();

    act(() => hook.result.current.startDrag("corpo", { x: 0, y: 0 }, { x: 0, y: 0 }));
    act(() => hook.result.current.endDrag());
    expect(hook.result.current.itemSelecionado).toBe("corpo");

    act(() => hook.result.current.nudge(4, -2));
    expect(positions.corpo).toEqual({ x: 504, y: 398 });
  });

  it("ignora hover durante o arraste", () => {
    const { hook } = setup();

    act(() => hook.result.current.startDrag("nome", { x: 0, y: 0 }, { x: 0, y: 0 }));
    act(() => hook.result.current.hover("corpo"));

    expect(hook.result.current.itemHover).toBe("nome");
  });
});
