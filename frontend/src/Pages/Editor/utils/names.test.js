import { describe, expect, it } from "vitest";
import {
  filterNamesForSave,
  getValidNames,
  mergeNamesWithOverrides,
  namesToBulkText,
  normalizeBulkText,
  parseBulkNames,
  resolveBodyText,
} from "./names";

describe("names utils", () => {
  it("getValidNames ignora itens vazios, só com espaços ou inválidos", () => {
    const names = [
      { nome: "Ana" },
      { nome: "   " },
      { nome: "" },
      null,
      { nome: 42 },
      { nome: "Bia" },
    ];

    expect(getValidNames(names)).toEqual([{ nome: "Ana" }, { nome: "Bia" }]);
  });

  it("normalizeBulkText remove \\r de colagens do Windows", () => {
    expect(normalizeBulkText("Ana\r\nBia\r\n")).toBe("Ana\nBia\n");
  });

  it("parseBulkNames separa por linha, faz trim e descarta linhas vazias", () => {
    expect(parseBulkNames("  Ana \n\n Bia\n   \nCarlos")).toEqual([
      "Ana",
      "Bia",
      "Carlos",
    ]);
  });

  it("mergeNamesWithOverrides preserva overrides pela posição", () => {
    const previous = [
      { nome: "Ana", overrides: { textoCorpo: "texto da Ana" } },
      { nome: "Bia", overrides: {} },
    ];

    expect(mergeNamesWithOverrides(["Ana Maria", "Bia", "Carlos"], previous)).toEqual([
      { nome: "Ana Maria", overrides: { textoCorpo: "texto da Ana" } },
      { nome: "Bia", overrides: {} },
      { nome: "Carlos", overrides: {} },
    ]);
  });

  it("namesToBulkText junta nomes não vazios com quebra de linha", () => {
    expect(
      namesToBulkText([{ nome: "Ana" }, { nome: " " }, { nome: "Bia" }])
    ).toBe("Ana\nBia");
  });

  it("filterNamesForSave remove vazios e garante overrides", () => {
    expect(
      filterNamesForSave([
        { nome: "Ana" },
        { nome: "" },
        { nome: "Bia", overrides: { textoCorpo: "x" } },
      ])
    ).toEqual([
      { nome: "Ana", overrides: {} },
      { nome: "Bia", overrides: { textoCorpo: "x" } },
    ]);
  });

  it("resolveBodyText usa o texto individual quando existe", () => {
    expect(resolveBodyText({ overrides: { textoCorpo: "próprio" } }, "global")).toBe(
      "próprio"
    );
    expect(resolveBodyText({ overrides: {} }, "global")).toBe("global");
    expect(resolveBodyText({}, "global")).toBe("global");
  });
});
