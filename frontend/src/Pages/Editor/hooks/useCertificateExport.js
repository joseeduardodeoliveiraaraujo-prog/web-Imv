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
  const [tipoExportacao, setTipoExportacao] = useState("");
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

  useEffect(() => {
    if (!menuDownloadAberto) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMenuDownloadAberto(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuDownloadAberto]);

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

  const runExport = async ({
    preparingMessage,
    errorMessage,
    tipo,
    task,
  }) => {
    if (!validateExport()) return;

    setTipoExportacao(tipo);
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
      setTipoExportacao("");
    }
  };

  const handleDownloadPdf = () =>
    runExport({
      preparingMessage: "Preparando o arquivo PDF...",
      errorMessage: "Ocorreu um erro ao gerar o PDF.",
      tipo: "PDF Único",
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
      tipo: "Imagens JPEG (.ZIP)",
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
      tipo: "PDFs Separados (.ZIP)",
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

  const toggleDownloadMenu = () => {
    if (estaGerando) return;
    setMenuDownloadAberto((current) => !current);
  };

  const closeDownloadMenu = () => setMenuDownloadAberto(false);

  return {
    estaGerando,
    mensagemStatus,
    progresso,
    tipoExportacao,
    menuDownloadAberto,
    toggleDownloadMenu,
    closeDownloadMenu,
    handleDownloadPdf,
    handleDownloadJpegZip,
    handleDownloadPdfZip,
  };
};
