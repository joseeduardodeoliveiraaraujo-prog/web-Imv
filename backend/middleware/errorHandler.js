function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  if (err.message === "Origem não permitida pelo CORS") {
    return res.status(403).json({ error: "Acesso negado" });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload excede o tamanho máximo" });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(413)
      .json({ error: "Arquivo excede o tamanho máximo de 5MB" });
  }

  if (err.message === "Apenas imagens são permitidas") {
    return res.status(400).json({ error: "Apenas imagens são permitidas" });
  }

  res.status(500).json({ error: "Erro interno do servidor" });
}

export default errorHandler;
