import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./routes/health.routes.js";
import usersRoutes from "./routes/users.routes.js";
import certificatesRoutes from "./routes/certificates.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import { generalLimiter } from "../middleware/rateLimiter.js";
import errorHandler from "../middleware/errorHandler.js";

// Inicialização da instância principal da API Express
const app = express();

// ==========================================================================
// MIDDLEWARES GLOBAIS DE SEGURANÇA
// ==========================================================================

app.use(helmet());

app.use(generalLimiter);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origem não permitida pelo CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

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
