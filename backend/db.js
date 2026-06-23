import pkg from "pg";
const { Pool } = pkg;
import "dotenv/config";

/**
 * INFRASTRUCTURE: Database Connection Pool
 * RESPONSIBILITY: Instanciar e gerenciar o pool de conexões reutilizáveis com o banco de dados PostgreSQL
 * (Supabase). Evita a abertura/fechamento manual de conexões a cada requisição HTTP recebida.
 */
const pool = new Pool({
  // Atribui a String de Conexão injetada via variáveis de ambiente (.env)
  connectionString: process.env.DATABASE_URL,
  
  // Configuração de Segurança de Transporte (TLS/SSL)
  ssl: {
    // Necessário para conexões em ambientes cloud (como Render/Supabase) que utilizam certificados autoassinados
    rejectUnauthorized: false
  }
});

export default pool;