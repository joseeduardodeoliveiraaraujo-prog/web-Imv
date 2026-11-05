import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installCanvasMock } from "../../../test/canvasMock";

const mocks = vi.hoisted(() => ({
  pdfs: [],
  zips: [],
  saveAs: vi.fn(),
}));

vi.mock("jspdf", () => ({
  jsPDF: class {
    constructor(options) {
      this.options = options;
      this.addImage = vi.fn();
      this.addPage = vi.fn();
      this.save = vi.fn();
      this.output = vi.fn(() => new Blob(["pdf"]));
      mocks.pdfs.push(this);
    }
  },
}));

vi.mock("jszip", () => ({
  default: class {
    constructor() {
      this.files = [];
      this.file = vi.fn((name, data) => this.files.push({ name, data }));
      this.generateAsync = vi.fn(async () => new Blob(["zip"]));
      mocks.zips.push(this);
    }
  },
}));

vi.mock("file-saver", () => ({ saveAs: mocks.saveAs }));

vi.mock("../utils/loadEditorFonts", () => ({
  loadEditorFonts: vi.fn(async () => {}),
  loadSelectedFonts: vi.fn(async () => {}),
}));

const { exportJpegZip, exportPdfZip, exportSinglePdf, sanitizeFileName } =
  await import("./certificateExport");

const IMAGE = { width: 200, height: 100 };
const NAMES = [
  { nome: "Ana Maria", overrides: {} },
  { nome: "Bia", overrides: { textoCorpo: "Texto da Bia" } },
  { nome: "Carlos", overrides: {} },
];
const STYLES = {
  corNome: "#000000",
  fonteNome: "Inter",
  tamanhoNome: 40,
  corCorpo: "#111111",
  fonteCorpo: "Lora",
  tamanhoCorpo: 20,
};
const POSITIONS = { nome: { x: 100, y: 10 }, corpo: { x: 100, y: 50 } };

const run = async (exporter) => {
  const onProgress = vi.fn();
  const onStatus = vi.fn();

  const promise = exporter({
    image: IMAGE,
    names: NAMES,
    bodyText: "Texto global",
    styles: STYLES,
    positions: POSITIONS,
    onProgress,
    onStatus,
  });

  await vi.runAllTimersAsync();
  await promise;

  return { onProgress, onStatus };
};

describe("certificateExport", () => {
  let contexts;

  beforeEach(() => {
    vi.useFakeTimers();
    mocks.pdfs.length = 0;
    mocks.zips.length = 0;
    mocks.saveAs.mockClear();
    contexts = installCanvasMock();
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { load: vi.fn(async () => []) },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("PDF único: uma página por nome, no tamanho da imagem", async () => {
    const { onProgress } = await run(exportSinglePdf);

    expect(mocks.pdfs).toHaveLength(1);
    const [pdf] = mocks.pdfs;
    expect(pdf.options).toMatchObject({ unit: "px", format: [200, 100], orientation: "l" });
    expect(pdf.addImage).toHaveBeenCalledTimes(3);
    expect(pdf.addPage).toHaveBeenCalledTimes(2);
    expect(pdf.save).toHaveBeenCalledWith("todos-os-certificados.pdf");
    expect(onProgress).toHaveBeenLastCalledWith(100);
  });

  it("PDF único: desenha nome e texto individual de cada participante", async () => {
    await run(exportSinglePdf);

    const drawn = contexts.flatMap((ctx) => ctx.fillText.mock.calls.map(([text]) => text));
    expect(drawn).toEqual(expect.arrayContaining(["Ana Maria", "Bia", "Carlos"]));
    expect(drawn.join(" ")).toContain("Texto da Bia");
    expect(drawn.join(" ")).toContain("Texto global");
  });

  it("ZIP de JPEGs: um arquivo por nome e download do ZIP", async () => {
    const { onProgress } = await run(exportJpegZip);

    const [zip] = mocks.zips;
    expect(zip.files.map((file) => file.name)).toEqual([
      "Ana_Maria_1.jpg",
      "Bia_2.jpg",
      "Carlos_3.jpg",
    ]);
    expect(mocks.saveAs).toHaveBeenCalledWith(
      expect.any(Blob),
      "certificados-individuais.zip"
    );
    expect(onProgress).toHaveBeenLastCalledWith(100);
  });

  it("ZIP de JPEGs: guarda binário (Blob), não base64", async () => {
    await run(exportJpegZip);

    const [zip] = mocks.zips;
    zip.files.forEach((file) => expect(file.data).toBeInstanceOf(Blob));
    expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled();
  });

  it("progresso é crescente e termina em 100", async () => {
    const { onProgress } = await run(exportPdfZip);

    const values = onProgress.mock.calls.map(([value]) => value);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(values.at(-1)).toBe(100);
  });

  it("ZIP de PDFs: um PDF por nome e download do ZIP", async () => {
    await run(exportPdfZip);

    const [zip] = mocks.zips;
    expect(zip.files.map((file) => file.name)).toEqual([
      "Ana_Maria_1.pdf",
      "Bia_2.pdf",
      "Carlos_3.pdf",
    ]);
    expect(mocks.pdfs).toHaveLength(3);
    mocks.pdfs.forEach((pdf) => expect(pdf.addImage).toHaveBeenCalledTimes(1));
    expect(mocks.saveAs).toHaveBeenCalledWith(
      expect.any(Blob),
      "certificados-pdf-separados.zip"
    );
  });
});

describe("sanitizeFileName", () => {
  it.each([
    ["Ana Maria", "Ana_Maria"],
    ["José da Silva", "José_da_Silva"],
    ["AC/DC: \"Ao Vivo\"?", "ACDC_Ao_Vivo"],
    ["  ..nome..  ", "nome"],
    ["<>:\"/\\|?*", "certificado"],
    ["a".repeat(120), "a".repeat(80)],
  ])("%j -> %j", (input, expected) => {
    expect(sanitizeFileName(input)).toBe(expected);
  });
});
