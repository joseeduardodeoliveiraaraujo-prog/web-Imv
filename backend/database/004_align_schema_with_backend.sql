-- Alinha o schema com as colunas usadas pelo backend.
-- Idempotente: pode ser executado em bancos que já receberam essas colunas manualmente.

ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS posicao_nome JSONB,
  ADD COLUMN IF NOT EXISTS posicao_corpo JSONB;
