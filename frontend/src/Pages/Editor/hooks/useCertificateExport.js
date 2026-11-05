import { useRef, useState } from "react";
import { toast } from "../../../components/Toast/toastStore";
import {
  exportJpegZip,
  exportPdfZip,
  exportSinglePdf,
} from "../services/certificateExport";
import { loadImage } from "../utils/loadImage";

const EXPORTS = {
  pdf: {
    tipo: "PDF Único",
    run: exportSinglePdf,
    errorMessage: "Ocorreu um erro ao gerar o PDF.",
  },
  pdfZip: {
    tipo: "PDFs Separados (.ZIP)",
    run: exportPdfZip,
    errorMessage: "Ocorreu um erro ao gerar os PDFs.",
  },
  jpegZip: {
    tipo: "Imagens JPEG (.ZIP)",
    run: exportJpegZip,
    errorMessage: "Ocorreu um erro ao gerar as imagens.",
  },
};

const getValidationError = (model) => {
  if (model.nomesValidos.length === 0) {
    return "Insira ao menos um nome na lista antes de exportar.";
  }

  const everyoneHasOwnText = model.nomesValidos.every(
    (item) => item.overrides?.textoCorpo?.trim()
  );

  if (model.textoCorpoBase.trim() === "" && !everyoneHasOwnText) {
    return "Escreva o texto do certificado antes de exportar.";
  }

  return null;
};

export const useCertificateExport = ({ certificate, model }) => {
  const [estaGerando, setEstaGerando] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState("");
  const [progresso, setProgresso] = useState(0);
  const [menuDownloadAberto, setMenuDownloadAberto] = useState(false);
  const [tipoExportacao, setTipoExportacao] = useState("");
  const runningRef = useRef(false);

  const handleExport = async (kind) => {
    const config = EXPORTS[kind];
    if (!config || !certificate || runningRef.current) return;

    setMenuDownloadAberto(false);

    const validationError = getValidationError(model);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    runningRef.current = true;
    setTipoExportacao(config.tipo);
    setEstaGerando(true);
    setProgresso(0);
    setMensagemStatus("Preparando...");

    try {
      const image = await loadImage(certificate.previewUrl);

      await config.run({
        image,
        names: model.nomesValidos,
        bodyText: model.textoCorpoBase,
        styles: model.styles,
        positions: model.positions,
        onProgress: setProgresso,
        onStatus: setMensagemStatus,
      });

      toast.success(
        model.nomesValidos.length === 1
          ? "Certificado gerado. O download foi iniciado."
          : `${model.nomesValidos.length} certificados gerados. O download foi iniciado.`
      );
    } catch (error) {
      console.error("Erro na exportação:", error);
      toast.error(config.errorMessage);
    } finally {
      runningRef.current = false;
      setEstaGerando(false);
      setMensagemStatus("");
      setTipoExportacao("");
    }
  };

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
    handleExport,
  };
};
