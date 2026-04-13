import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "projeto_imv",
  password: "imv1234",
  port: 5432,
});

export default pool;