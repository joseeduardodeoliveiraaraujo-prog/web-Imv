import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * O jsdom não aplica a cascata de CSS. Este teste protege a ordem das regras:
 * com a mesma especificidade, a regra que vem por último vence. Um erro de ordem
 * já fez a gaveta de propriedades não aparecer no celular.
 */
const editorDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const importedFiles = () =>
  [...readFileSync(join(editorDir, "Editor.css"), "utf8").matchAll(/@import "\.\/styles\/([\w-]+\.css)"/g)]
    .map((match) => match[1]);

// Concatena os arquivos na ordem de import, como o bundle final.
const bundledCss = () =>
  importedFiles()
    .map((file) => readFileSync(join(editorDir, "styles", file), "utf8"))
    .join("\n");

describe("ordem da cascata do Editor", () => {
  it("responsive.css é o último import", () => {
    expect(importedFiles().at(-1)).toBe("responsive.css");
  });

  it("a gaveta (position: fixed) vem depois da regra base .editor-sidebar", () => {
    const css = bundledCss();
    const baseRule = css.search(/(^|\n)\.editor-sidebar\s*\{[^}]*position:\s*relative/);
    const drawerRule = css.search(/@media \(max-width: 1080px\)\s*\{\s*\.editor-sidebar\s*\{[^}]*position:\s*fixed/);

    expect(baseRule).toBeGreaterThanOrEqual(0);
    expect(drawerRule).toBeGreaterThan(baseRule);
  });

  it("os ajustes de celular vêm depois das regras base da área de trabalho", () => {
    const css = bundledCss();
    const base = css.search(/(^|\n)\.editor-workspace\.bulk-scroll\s*\{/);
    const mobile = css.search(/@media \(max-width: 768px\)\s*\{\s*\.editor-workspace\.bulk-scroll/);

    expect(base).toBeGreaterThanOrEqual(0);
    expect(mobile).toBeGreaterThan(base);
  });
});
