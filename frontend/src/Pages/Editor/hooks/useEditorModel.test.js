import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useEditorModel } from "./useEditorModel";

const PROJECT = {
  id: 9,
  certificate_id: 3,
  nomes_lista: [
    { nome: "Ana", overrides: { textoCorpo: "Texto da Ana" } },
    { nome: "Bia", overrides: {} },
  ],
  texto_corpo: "Participou",
  cor_nome: "#111111",
  fonte_nome: "Lora",
  tamanho_nome: 70,
  cor_corpo: "#222222",
  fonte_corpo: "Roboto",
  tamanho_corpo: 30,
  posicao_nome: { x: 10, y: 20 },
  posicao_corpo: { x: 30, y: 40 },
};

const typeNames = (result, value) =>
  act(() => result.current.handleBulkNames({ target: { value } }));

describe("useEditorModel", () => {
  it("começa com um item vazio e valores padrão", () => {
    const { result } = renderHook(() => useEditorModel());

    expect(result.current.nomesLista).toEqual([{ nome: "", overrides: {} }]);
    expect(result.current.nomesValidos).toEqual([]);
    expect(result.current.styles).toEqual({
      corNome: "#000000",
      fonteNome: "Inter",
      tamanhoNome: 90,
      corCorpo: "#000000",
      fonteCorpo: "Inter",
      tamanhoCorpo: 40,
    });
  });

  it("handleBulkNames atualiza a lista e mantém overrides por posição", () => {
    const { result } = renderHook(() => useEditorModel());

    typeNames(result, "Ana\r\nBia");
    act(() => result.current.setIndexEditando(0));
    act(() =>
      result.current.updateStyle("textoCorpo", "Só da Ana", result.current.setTextoCorpo)
    );
    typeNames(result, "Ana Maria\nBia\nCarlos");

    expect(result.current.bulkText).toBe("Ana Maria\nBia\nCarlos");
    expect(result.current.nomesLista).toEqual([
      { nome: "Ana Maria", overrides: { textoCorpo: "Só da Ana" } },
      { nome: "Bia", overrides: {} },
      { nome: "Carlos", overrides: {} },
    ]);
  });

  it("updateStyle sem item em edição altera o valor global", () => {
    const { result } = renderHook(() => useEditorModel());

    act(() =>
      result.current.updateStyle("textoCorpo", "Global", result.current.setTextoCorpo)
    );

    expect(result.current.textoCorpo).toBe("Global");
    expect(result.current.textoCorpoBase).toBe("Global");
  });

  it("applyProject carrega todos os campos salvos", () => {
    const { result } = renderHook(() => useEditorModel());

    act(() => result.current.applyProject(PROJECT));

    expect(result.current.nomesLista).toEqual(PROJECT.nomes_lista);
    expect(result.current.bulkText).toBe("Ana\nBia");
    expect(result.current.textoCorpo).toBe("Participou");
    expect(result.current.styles).toEqual({
      corNome: "#111111",
      fonteNome: "Lora",
      tamanhoNome: 70,
      corCorpo: "#222222",
      fonteCorpo: "Roboto",
      tamanhoCorpo: 30,
    });
    expect(result.current.positions).toEqual({
      nome: { x: 10, y: 20 },
      corpo: { x: 30, y: 40 },
    });
  });

  it("isDirty: falso no início e depois de carregar um projeto", () => {
    const { result } = renderHook(() => useEditorModel());
    expect(result.current.isDirty).toBe(false);

    act(() => result.current.applyProject(PROJECT));
    expect(result.current.isDirty).toBe(false);
  });

  it("isDirty: verdadeiro após editar e falso de novo após markSaved", () => {
    const { result } = renderHook(() => useEditorModel());

    typeNames(result, "Ana");
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.markSaved(result.current.snapshot));
    expect(result.current.isDirty).toBe(false);

    act(() => result.current.setPosicaoNome({ x: 1, y: 2 }));
    expect(result.current.isDirty).toBe(true);
  });

  it("edição feita durante o salvamento continua pendente", () => {
    const { result } = renderHook(() => useEditorModel());

    typeNames(result, "Ana");
    const enviado = result.current.snapshot;
    typeNames(result, "Ana\nBia");
    act(() => result.current.markSaved(enviado));

    expect(result.current.isDirty).toBe(true);
  });

  it("applyProject sem posições usa os valores padrão do editor", () => {
    const { result } = renderHook(() => useEditorModel());

    act(() =>
      result.current.applyProject({ ...PROJECT, posicao_nome: null, posicao_corpo: null })
    );

    expect(result.current.positions).toEqual({
      nome: { x: 500, y: 300 },
      corpo: { x: 500, y: 500 },
    });
  });

  it("mantém o mesmo medidor de texto entre renders (cache estável)", () => {
    const { result, rerender } = renderHook(() => useEditorModel());
    const measurer = result.current.getCachedTextBox;

    rerender();
    act(() => result.current.setTextoCorpo("x"));

    expect(result.current.getCachedTextBox).toBe(measurer);
  });

  it("buildProjectPayload monta o contrato esperado pela API", () => {
    const { result } = renderHook(() => useEditorModel());

    act(() => result.current.applyProject(PROJECT));

    expect(result.current.buildProjectPayload(3)).toEqual({
      nomesLista: PROJECT.nomes_lista,
      textoCorpo: "Participou",
      estilos: {
        corNome: "#111111",
        fonteNome: "Lora",
        tamanhoNome: 70,
        corCorpo: "#222222",
        fonteCorpo: "Roboto",
        tamanhoCorpo: 30,
      },
      posicoes: { nome: { x: 10, y: 20 }, corpo: { x: 30, y: 40 } },
      certificadoId: 3,
    });
  });
});
