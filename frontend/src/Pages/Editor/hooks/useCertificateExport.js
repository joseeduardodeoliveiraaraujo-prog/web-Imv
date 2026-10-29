import { useCallback, useEffect, useRef, useState } from "react";
import {
  exportJpegZip,
  exportPdfZip,
  exportSinglePdf,
} from "../services/certificateExport";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useCertificateExport = ({ certificate, model }) => {
  const [estaGerando, setEstaGerando] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState("");
  const [progresso, setProgresso] = useState(0);
  const [menuDownloadAberto, setMenuDownloadAberto] = useState(false);
  const imageCacheRef = useRef(null);

  const previewUrl = certificate?.previewUrl;

  const preloadCertificateImage = useCallback(async () => {
    if (imageCacheRef.current) return imageCacheRef.current;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = previewUrl;

      img.onload = () => {
        imageCacheRef.current = img;
        resolve(img);
      };

      img.onerror = reject;
    });
  }, [previewUrl]);

  useEffect(() => {
    if (!previewUrl) return;

    imageCacheRef.current = null;
    preloadCertificateImage();
  }, [previewUrl, preloadCertificateImage]);

  const validateExport = () => {
    if (model.nomesValidos.length === 0) {
      alert("Insira nomes na lista!");
      return false;
    }

    if (model.textoCorpoBase.trim() === "") {
      alert("Insira um texto para o certificado!");
      return false;
    }

    return true;
  };

  const runExport = async ({ preparingMessage, errorMessage, task }) => {
    if (!validateExport()) return;

    setEstaGerando(true);
    setProgresso(5);
    setMensagemStatus(preparingMessage);
    await sleep(600);

    try {
      const image = await preloadCertificateImage();

      await task(image);
    } catch (error) {
      console.error(error);
      alert(errorMessage);
    } finally {
      setEstaGerando(false);
      setMensagemStatus("");
    }
  };

  const handleDownloadPdf = () =>
    runExport({
      preparingMessage: "Preparando o arquivo PDF...",
      errorMessage: "Ocorreu um erro ao gerar o PDF.",
      task: (image) =>
        exportSinglePdf({
          image,
          names: model.nomesValidos,
          bodyText: model.textoCorpoBase,
          styles: model.styles,
          positions: model.positions,
          onProgress: setProgresso,
          onStatus: setMensagemStatus,
        }),
    });

  const handleDownloadJpegZip = () =>
    runExport({
      preparingMessage: "Preparando os arquivos...",
      errorMessage: "Ocorreu um erro ao gerar os certificados.",
      task: (image) =>
        exportJpegZip({
          image,
          names: model.nomesValidos,
          bodyText: model.textoCorpoBase,
          styles: model.styles,
          positions: model.positions,
          onProgress: setProgresso,
          onStatus: setMensagemStatus,
        }),
    });

  const handleDownloadPdfZip = () =>
    runExport({
      preparingMessage: "Preparando os arquivos...",
      errorMessage: "Ocorreu um erro ao gerar os certificados.",
      task: (image) =>
        exportPdfZip({
          image,
          names: model.nomesValidos,
          bodyText: model.textoCorpoBase,
          styles: model.styles,
          positions: model.positions,
          onProgress: setProgresso,
          onStatus: setMensagemStatus,
        }),
    });

  const toggleDownloadMenu = () =>
    setMenuDownloadAberto((current) => !current);

  const closeDownloadMenu = () => setMenuDownloadAberto(false);

  return {
    estaGerando,
    mensagemStatus,
    progresso,
    menuDownloadAberto,
    toggleDownloadMenu,
    closeDownloadMenu,
    handleDownloadPdf,
    handleDownloadJpegZip,
    handleDownloadPdfZip,
  };
};
