import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./routes/health.routes.js";
import usersRoutes from "./routes/users.routes.js";
import certificatesRoutes from "./routes/certificates.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import { generalLimiter } from "../middleware/rateLimiter.js";
import errorHandler from "../middleware/errorHandler.js";
import requestId from "../middleware/requestId.js";
import { ForbiddenError } from "./errors/app-errors.js";

// Inicialização da instância principal da API Express
const app = express();

// ==========================================================================
// MIDDLEWARES GLOBAIS DE SEGURANÇA
// ==========================================================================

// O Render encaminha as requisições por um proxy reverso.
app.set("trust proxy", 1);

app.use(requestId);

app.use(helmet());

// Aceita "https://a.com, https://b.com/" (espaços e barra final são ignorados).
const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, "");

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("[WARN] Origem bloqueada pelo CORS:", origin);
        callback(new ForbiddenError("Acesso negado"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    exposedHeaders: ["X-Request-Id"],
  })
);

app.use(generalLimiter);

app.use(express.json({ limit: "1mb" }));

// ==========================================================================
// ROTAS DE VERIFICAÇÃO / HEALTH CHECK
// ==========================================================================

app.use(healthRoutes);

// ==========================================================================
// ROTAS DE GERENCIAMENTO DE USUÁRIOS
// ==========================================================================

app.use(usersRoutes);

// ==========================================================================
// ROTAS DE MODELOS DE CERTIFICADOS
// ==========================================================================

app.use(certificatesRoutes);

// ==========================================================================
// ROTAS DE GERENCIAMENTO DE PROJETOS (WORKSPACES DE EDIÇÃO)
// ==========================================================================

app.use(projectsRoutes);

// ==========================================================================
// HANDLER GLOBAL DE ERROS (deve ser o último middleware registrado)
// ==========================================================================

app.use(errorHandler);

export default app;
