CREATE TABLE projects (
  id SERIAL PRIMARY KEY,

  user_id INTEGER NOT NULL,
  certificate_id INTEGER NOT NULL,

  nomes_lista JSONB,
  texto_corpo TEXT,

  cor_nome TEXT,
  fonte_nome TEXT,
  tamanho_nome INTEGER,

  cor_corpo TEXT,
  fonte_corpo TEXT,
  tamanho_corpo INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_user
    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_certificate
    FOREIGN KEY(certificate_id)
    REFERENCES certificates(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_projects_user_id
ON projects(user_id);

CREATE INDEX idx_projects_certificate_id
ON projects(certificate_id);

CREATE INDEX idx_certificates_user_id
ON certificates(user_id);