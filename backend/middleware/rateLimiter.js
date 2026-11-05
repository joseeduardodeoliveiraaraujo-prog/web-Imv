import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const skipPreflight = (req) => req.method === "OPTIONS";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  message: { error: "Muitas requisições. Tente novamente mais tarde." },
});

// Executado após o authMiddleware: a cota é por usuário, para que pessoas
// atrás do mesmo IP (NAT de escola/empresa) não dividam o limite.
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  keyGenerator: (req) =>
    req.user?.uid ? `uid:${req.user.uid}` : ipKeyGenerator(req.ip),
  message: { error: "Limite de uploads atingido. Tente novamente mais tarde." },
});
