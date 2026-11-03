import rateLimit from "express-rate-limit";

const skipPreflight = (req) => req.method === "OPTIONS";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  message: { error: "Muitas requisições. Tente novamente mais tarde." },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  message: { error: "Muitas tentativas de login. Aguarde 15 minutos." },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  message: { error: "Limite de uploads atingido. Tente novamente mais tarde." },
});
