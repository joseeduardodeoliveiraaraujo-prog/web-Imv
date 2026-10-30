import pool from "../../db.js";

export async function create({
  userId,
  certificateId,
  nomesLista,
  textoCorpo,
  estilos,
  posicoes,
}) {
  return pool.query(
    `INSERT INTO projects (
        user_id, certificate_id, nomes_lista, texto_corpo,
        cor_nome, fonte_nome, tamanho_nome,
        cor_corpo, fonte_corpo, tamanho_corpo,
        posicao_nome, posicao_corpo
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
    [
      userId,
      certificateId,
      JSON.stringify(nomesLista),
      textoCorpo,
      estilos.corNome,
      estilos.fonteNome,
      estilos.tamanhoNome,
      estilos.corCorpo,
      estilos.fonteCorpo,
      estilos.tamanhoCorpo,
      JSON.stringify(posicoes.nome),
      JSON.stringify(posicoes.corpo),
    ]
  );
}

export async function listIdsByUserId(userId) {
  return pool.query(
    `
      SELECT id
      FROM projects
      WHERE user_id = $1
      ORDER BY updated_at DESC
      `,
    [userId]
  );
}

export async function removeByIds(ids) {
  return pool.query(
    `
        DELETE FROM projects
        WHERE id = ANY($1::int[])
        `,
    [ids]
  );
}

export async function listRecentByUserId(userId) {
  return pool.query(
    `
      SELECT
        p.*,
        c.title,
        c.thumbnail_path
      FROM projects p
      JOIN certificates c
        ON c.id = p.certificate_id
      WHERE p.user_id = $1
      ORDER BY p.updated_at DESC
      LIMIT 3
      `,
    [userId]
  );
}

export async function findByIdAndUserId(id, userId) {
  return pool.query(
    `
      SELECT
        p.*,
        c.title,
        c.image_path,
        c.thumbnail_path
      FROM projects p
      JOIN certificates c
        ON c.id = p.certificate_id
      WHERE p.id = $1
      AND p.user_id = $2
      `,
    [id, userId]
  );
}

export async function updateByIdAndUserId({
  id,
  userId,
  nomesLista,
  textoCorpo,
  estilos,
  posicoes,
}) {
  return pool.query(
    `UPDATE projects
       SET
        nomes_lista = $1,
        texto_corpo = $2,
        cor_nome = $3,
        fonte_nome = $4,
        tamanho_nome = $5,
        cor_corpo = $6,
        fonte_corpo = $7,
        tamanho_corpo = $8,
        posicao_nome = $9,
        posicao_corpo = $10,
        updated_at = NOW()
       WHERE id = $11 AND user_id = $12
       RETURNING *`,
    [
      JSON.stringify(nomesLista),
      textoCorpo,
      estilos.corNome,
      estilos.fonteNome,
      estilos.tamanhoNome,
      estilos.corCorpo,
      estilos.fonteCorpo,
      estilos.tamanhoCorpo,
      JSON.stringify(posicoes.nome),
      JSON.stringify(posicoes.corpo),
      id,
      userId,
    ]
  );
}
