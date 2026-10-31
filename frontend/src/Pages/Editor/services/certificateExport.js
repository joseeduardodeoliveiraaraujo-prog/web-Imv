import { renderCertificateForExport } from "../utils/canvasRenderer";
import { loadEditorFonts } from "../utils/loadEditorFonts";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loadExportDependencies = async () => {
  const [{ default: JSZip }, { saveAs }, { jsPDF }] = await Promise.all([
    import("jszip"),
    import("file-saver"),
    import("jspdf"),
  ]);

  return { JSZip, saveAs, jsPDF };
};

const loadFonts = async (styles) => {
  await loadEditorFonts();
  await document.fonts.load(
    `${styles.tamanhoNome}px "${styles.fonteNome}"`
  );
  await document.fonts.load(
    `${styles.tamanhoCorpo}px "${styles.fonteCorpo}"`
  );
};

const createTempCanvas = (img) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = img.width;
  canvas.height = img.height;

  return { canvas, ctx };
};

const getOrientation = (img) => (img.width > img.height ? "l" : "p");

const getProgress = (index, total) =>
  Math.round(20 + ((index + 1) / total) * 70);

const getFileName = (name, index, extension) =>
  `${name.replace(/\s+/g, "_")}_${index + 1}.${extension}`;

const getItemBody = (item, bodyText) =>
  item.overrides?.textoCorpo || bodyText;

export const exportSinglePdf = async ({
  image,
  names,
  bodyText,
  styles,
  positions,
  onProgress,
  onStatus,
}) => {
  onStatus("Carregando fontes e estilos...");
  onProgress(15);
  await sleep(600);
  await loadFonts(styles);
  const { jsPDF } = await loadExportDependencies();

  const orientation = getOrientation(image);
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [image.width, image.height],
    compress: true,
  });

  const { canvas, ctx } = createTempCanvas(image);

  for (let i = 0; i < names.length; i++) {
    const item = names[i];
    const itemBody = getItemBody(item, bodyText);

    onProgress(getProgress(i, names.length));
    onStatus(`Desenhando certificado ${i + 1} de ${names.length}...`);

    renderCertificateForExport(
      ctx,
      image,
      item.nome,
      itemBody,
      canvas.width,
      styles,
      positions
    );

    const imgData = canvas.toDataURL("image/jpeg", 0.75);

    if (i > 0) pdf.addPage([image.width, image.height], orientation);
    pdf.addImage(imgData, "JPEG", 0, 0, image.width, image.height);

    if (names.length > 30 && i % 15 === 0) await sleep(10);
  }

  await sleep(500);
  onStatus("Finalizando arquivo e disparando download...");
  onProgress(95);
  await sleep(800);

  pdf.save("todos-os-certificados.pdf");

  onStatus("Download concluído!");
  onProgress(100);
  await sleep(600);
};

export const exportJpegZip = async ({
  image,
  names,
  bodyText,
  styles,
  positions,
  onProgress,
  onStatus,
}) => {
  onStatus("Carregando fontes e estilos...");
  onProgress(15);
  await sleep(600);
  await loadFonts(styles);
  const { JSZip, saveAs } = await loadExportDependencies();

  const { canvas, ctx } = createTempCanvas(image);
  const zip = new JSZip();

  for (let i = 0; i < names.length; i++) {
    const item = names[i];
    const itemBody = getItemBody(item, bodyText);

    onProgress(getProgress(i, names.length));
    onStatus(`Gerando imagens ${i + 1} de ${names.length}...`);

    renderCertificateForExport(
      ctx,
      image,
      item.nome,
      itemBody,
      canvas.width,
      styles,
      positions
    );

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
    zip.file(getFileName(item.nome, i, "jpg"), dataUrl, { base64: true });
  }

  await sleep(500);
  onStatus("Compactando arquivos no ZIP...");
  onProgress(95);
  await sleep(800);

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "certificados-individuais.zip");

  onStatus("Download concluído!");
  onProgress(100);
  await sleep(500);
};

export const exportPdfZip = async ({
  image,
  names,
  bodyText,
  styles,
  positions,
  onProgress,
  onStatus,
}) => {
  onStatus("Carregando fontes e estilos...");
  onProgress(15);
  await sleep(600);
  await loadFonts(styles);
  const { JSZip, saveAs, jsPDF } = await loadExportDependencies();

  const { canvas, ctx } = createTempCanvas(image);
  const orientation = getOrientation(image);
  const zip = new JSZip();

  for (let i = 0; i < names.length; i++) {
    const item = names[i];
    const itemBody = getItemBody(item, bodyText);

    onProgress(getProgress(i, names.length));
    onStatus(`Gerando PDF ${i + 1} de ${names.length}...`);

    renderCertificateForExport(
      ctx,
      image,
      item.nome,
      itemBody,
      canvas.width,
      styles,
      positions
    );

    const imgData = canvas.toDataURL("image/jpeg", 0.75);
    const pdf = new jsPDF({
      orientation,
      unit: "px",
      format: [image.width, image.height],
      compress: true,
    });
    pdf.addImage(imgData, "JPEG", 0, 0, image.width, image.height);

    zip.file(getFileName(item.nome, i, "pdf"), pdf.output("blob"));
  }

  await sleep(500);
  onStatus("Compactando arquivos no ZIP...");
  onProgress(95);
  await sleep(800);

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "certificados-pdf-separados.zip");

  onStatus("Download concluído!");
  onProgress(100);
  await sleep(500);
};
