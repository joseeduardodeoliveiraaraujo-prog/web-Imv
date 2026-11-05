import multer from "multer";
import { AppError } from "../src/errors/app-errors.js";

const logPrefix = (req) => `[ERROR] ${req.method} ${req.path} [${req.id}]:`;

function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    if (err.status >= 500) {
      console.error(logPrefix(req), err.message);
    }
    return res.status(err.status).json({ error: err.message });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload excede o tamanho máximo" });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON inválido" });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ error: "Arquivo excede o tamanho máximo de 5MB" });
    }
    return res.status(400).json({ error: "Upload inválido" });
  }

  console.error(logPrefix(req), err.stack || err.message);
  res.status(500).json({ error: "Erro interno do servidor" });
}

export default errorHandler;
