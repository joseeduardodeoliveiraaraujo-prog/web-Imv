import { renderCertificateForExport } from "../utils/canvasRenderer";
import { loadSelectedFonts } from "../utils/loadEditorFonts";

const JPEG_QUALITY_PDF = 0.75;
const JPEG_QUALITY_IMAGE = 0.8;

const loadExportDependencies = async () => {
  const [{ default: JSZip }, { saveAs }, { jsPDF }] = await Promise.all([
    import("jszip"),
    import("file-saver"),
    import("jspdf"),
  ]);

  return { JSZip, saveAs, jsPDF };
};

const createTempCanvas = (img) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = img.width;
  canvas.height = img.height;

  return { canvas, ctx };
};

/**
 * Codificação assíncrona e binária (sem base64). Além de economizar memória,
 * o await devolve o controle ao navegador entre certificados: a barra de
 * progresso é atualizada e a aba não congela em listas grandes.
 */
const canvasToJpeg = (canvas, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Falha ao gerar a imagem")),
      "image/jpeg",
      quality
    );
  });

const blobToBytes = async (blob) => new Uint8Array(await blob.arrayBuffer());

const getOrientation = (img) => (img.width > img.height ? "l" : "p");

const getProgress = (index, total) =>
  Math.round(10 + ((index + 1) / total) * 80);

const INVALID_FILE_CHARS = /[<>:"/\\|?*]/g;

export const sanitizeFileName = (name) => {
  const safe = String(name)
    .normalize("NFC")
    .replace(INVALID_FILE_CHARS, "")
    .replace(/[\p{Cc}]/gu, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 80);

  return safe || "certificado";
};

const getFileName = (name, index, extension) =>
  `${sanitizeFileName(name)}_${index + 1}.${extension}`;

const getItemBody = (item, bodyText) =>
  item.overrides?.textoCorpo || bodyText;

/**
 * Desenha e codifica cada certificado em sequência, chamando onItem com o JPEG.
 */
const renderEach = async ({
  image,
  names,
  bodyText,
  styles,
  positions,
  quality,
  statusLabel,
  onProgress,
  onStatus,
  onItem,
}) => {
  const { canvas, ctx } = createTempCanvas(image);

  for (let i = 0; i < names.length; i++) {
    const item = names[i];

    onStatus(`${statusLabel} ${i + 1} de ${names.length}...`);

    renderCertificateForExport(
      ctx,
      image,
      item.nome,
      getItemBody(item, bodyText),
      canvas.width,
      styles,
      positions
    );

    const jpeg = await canvasToJpeg(canvas, quality);
    await onItem(jpeg, item, i);

    onProgress(getProgress(i, names.length));
  }
};

const prepare = async ({ styles, onProgress, onStatus }) => {
  onStatus("Carregando fontes e estilos...");
  onProgress(5);
  await loadSelectedFonts(styles);
  return loadExportDependencies();
};

const finishZip = async ({ zip, saveAs, fileName, onProgress, onStatus }) => {
  onStatus("Compactando arquivos no ZIP...");
  onProgress(92);

  const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
    onProgress(Math.min(99, 92 + Math.round(metadata.percent * 0.07)));
  });

  saveAs(content, fileName);
  onStatus("Download iniciado!");
  onProgress(100);
};

export const exportSinglePdf = async (options) => {
  const { image, onProgress, onStatus } = options;
  const { jsPDF } = await prepare(options);

  const orientation = getOrientation(image);
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [image.width, image.height],
    compress: true,
  });

  await renderEach({
    ...options,
    quality: JPEG_QUALITY_PDF,
    statusLabel: "Desenhando certificado",
    onItem: async (jpeg, _item, index) => {
      if (index > 0) pdf.addPage([image.width, image.height], orientation);
      pdf.addImage(await blobToBytes(jpeg), "JPEG", 0, 0, image.width, image.height);
    },
  });

  onStatus("Finalizando arquivo PDF...");
  onProgress(95);
  pdf.save("todos-os-certificados.pdf");

  onStatus("Download iniciado!");
  onProgress(100);
};

export const exportJpegZip = async (options) => {
  const { JSZip, saveAs } = await prepare(options);
  const zip = new JSZip();

  await renderEach({
    ...options,
    quality: JPEG_QUALITY_IMAGE,
    statusLabel: "Gerando imagem",
    onItem: (jpeg, item, index) => {
      zip.file(getFileName(item.nome, index, "jpg"), jpeg);
    },
  });

  await finishZip({
    zip,
    saveAs,
    fileName: "certificados-individuais.zip",
    onProgress: options.onProgress,
    onStatus: options.onStatus,
  });
};

export const exportPdfZip = async (options) => {
  const { image } = options;
  const { JSZip, saveAs, jsPDF } = await prepare(options);
  const orientation = getOrientation(image);
  const zip = new JSZip();

  await renderEach({
    ...options,
    quality: JPEG_QUALITY_PDF,
    statusLabel: "Gerando PDF",
    onItem: async (jpeg, item, index) => {
      const pdf = new jsPDF({
        orientation,
        unit: "px",
        format: [image.width, image.height],
        compress: true,
      });
      pdf.addImage(await blobToBytes(jpeg), "JPEG", 0, 0, image.width, image.height);
      zip.file(getFileName(item.nome, index, "pdf"), pdf.output("blob"));
    },
  });

  await finishZip({
    zip,
    saveAs,
    fileName: "certificados-pdf-separados.zip",
    onProgress: options.onProgress,
    onStatus: options.onStatus,
  });
};
