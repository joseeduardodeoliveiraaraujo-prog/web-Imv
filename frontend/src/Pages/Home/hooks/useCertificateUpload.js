import { useRef, useState } from "react";
import { toast } from "../../../components/Toast/toastStore";
import { uploadCertificate } from "../../../services/certificatesApi";
import { formatCertificate, getRequestErrorMessage } from "../utils/homeFormatters";

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];

export const validateUploadFile = (file) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Formato inválido. Envie um arquivo PNG ou JPEG.";
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return "O arquivo excede o limite de 5 MB.";
  }

  return null;
};

const getUploadErrorMessage = (error) => {
  if (error?.status === 400) {
    return "O arquivo não é uma imagem PNG ou JPEG válida (ou passa de 50 megapixels).";
  }

  return getRequestErrorMessage(
    error,
    "Não foi possível enviar o modelo. Tente novamente."
  );
};

export const useCertificateUpload = ({ user, onUploaded }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const processUpload = async (file) => {
    if (!user || !file) return;

    setUploadError("");

    const validationError = validateUploadFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setIsUploading(true);

    try {
      const token = await user.getIdToken();
      const newCert = await uploadCertificate(file, token);
      onUploaded(formatCertificate(newCert));
      toast.success("Modelo enviado.");
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
      setUploadError(getUploadErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    processUpload(file);
    event.target.value = "";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    if (isUploading) return;
    processUpload(event.dataTransfer.files?.[0]);
  };

  return {
    fileInputRef,
    isDragging,
    isUploading,
    uploadError,
    openFilePicker,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
