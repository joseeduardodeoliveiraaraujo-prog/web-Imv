import pkg from "pg";
const { Pool } = pkg;
import "dotenv/config";

/**
 * INFRASTRUCTURE: Database Connection Pool
 * RESPONSIBILITY: Instanciar e gerenciar o pool de conexões reutilizáveis com o banco de dados PostgreSQL
 * (Supabase). Evita a abertura/fechamento manual de conexões a cada requisição HTTP recebida.
 */
const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

// Com o certificado de CA do Supabase (Base64 do .crt), o certificado do servidor
// é validado. Sem ele, mantém o comportamento anterior (TLS sem verificação).
const buildSslConfig = () => {
  const caBase64 = process.env.DATABASE_CA_CERT_BASE64;

  if (!caBase64) {
    return { rejectUnauthorized: false };
  }

  return {
    ca: Buffer.from(caBase64, "base64").toString("utf-8"),
    rejectUnauthorized: true,
  };
};

const pool = new Pool({
  // Atribui a String de Conexão injetada via variáveis de ambiente (.env)
  connectionString: process.env.DATABASE_URL,

  max: toPositiveInt(process.env.DB_POOL_MAX, 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  query_timeout: 15000,

  // Configuração de Segurança de Transporte (TLS/SSL)
  ssl: buildSslConfig(),
});

// Conexões ociosas derrubadas pelo servidor emitem "error" no pool;
// sem este listener o processo Node é encerrado.
pool.on("error", (error) => {
  console.error("[ERROR] Pool PostgreSQL:", error.message);
});

export default pool;
