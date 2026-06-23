import express from "express";
import cors from "cors";
import pool from "./db.js";
import authMiddleware from "./middleware/auth.js";
import multer from "multer";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

// Inicialização da instância principal da API Express
const app = express();

// Instanciação do client do Supabase para transações no Storage Bucket
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ==========================================================================
// MIDDLEWARES GLOBAIS
// ==========================================================================

// Configuração de segurança e compartilhamento de recursos de origem cruzada (CORS)
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Habilita o parse automático de payloads de entrada formatados em JSON
app.use(express.json());

// ==========================================================================
// ROTAS DE VERIFICAÇÃO / HEALTH CHECK
// ==========================================================================

app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Erro no banco" });
  }
});

// ==========================================================================
// ROTAS DE GERENCIAMENTO DE USUÁRIOS
// ==========================================================================

/**
 * ROUTE: POST /users
 * RESPONSIBILITY: Sincronizar o login do usuário do Firebase com o banco PostgreSQL. 
 * Se o UID não existir, cria o registro; se já existir, retorna os dados atuais (Idempotência).
 */
app.post("/users", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const file = req.file; // Nota: Propriedade disponível se houver upload multipart, sem uso direto nesta lógica

    if (!name || name.length < 3) {
      return res.status(400).json({ error: "Nome inválido" });
    }

    const email = req.user.email;
    const uid = req.user.uid;

    const result = await pool.query(
      `INSERT INTO users (name, email, firebase_uid)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid) DO NOTHING
       RETURNING *`,
      [name, email, uid]
    );

    // Se o registro já existia (ON CONFLICT disparado), busca o usuário existente
    if (result.rows.length === 0) {
      const existingUser = await pool.query(
        "SELECT * FROM users WHERE firebase_uid = $1",
        [uid]
      );
      return res.json(existingUser.rows[0]);
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar usuário" });
  }
});

// ==========================================================================
// CONFIGURAÇÃO DO MULTER (MIDDLEWARE DE ARQUIVOS)
// ==========================================================================

// Configura o buffer temporário em memória e travas de segurança de tamanho/tipo de mídia
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Teto operacional: 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas"));
    }
  }
});

// ==========================================================================
// ROTAS DE MODELOS DE CERTIFICADOS
// ==========================================================================

/**
 * ROUTE: POST /certificates
 * RESPONSIBILITY: Receber um arquivo de imagem, sanitizar o nome, gerar uma versão minificada
 * (Thumbnail) via Sharp, efetuar o upload concorrente de ambas para o Supabase Storage e persistir o modelo no banco.
 * PATTERN: Implementa Rollback em cascata caso ocorra falha no Storage ou no PostgreSQL.
 */
app.post("/certificates", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.length < 3) {
      return res.status(400).json({ error: "Nome inválido" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    const email = req.user.email;

    // Resolução de Dependência: Localiza a Primary Key interna do usuário associado
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Sanitização de string para evitar falhas de encoding ou quebras de URL no Bucket
    const safeName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^\w.-]/g, "");

    const fileName = `${Date.now()}_${safeName}`;
    const thumbname = `thumb_${fileName}`;

    // Processamento de Imagem: Otimização e compressão da miniatura de preview
    const thumbnailBuffer = await sharp(file.buffer)
      .resize({ width: 300 }) 
      .webp({ quality: 70 }) 
      .toBuffer();

    // Upload Concorrente Assíncrono: Dispara ambos os arquivos em paralelo otimizando o tempo de resposta (I/O)
    const [originalUpload, thumbUpload] = await Promise.all([
      supabase.storage.from("certificates").upload(fileName, file.buffer, {
        cacheControl: "31536000", // Cache persistente no cliente por 1 ano
        contentType: file.mimetype
      }),
      supabase.storage.from("certificates").upload(thumbname, thumbnailBuffer, {
        cacheControl: "31536000", 
        contentType: "image/webp"
      })
    ]);

    // Mecanismo de Defesa: Valida se houve falha em algum dos uploads e limpa arquivos órfãos (Rollback)
    if (originalUpload.error || thumbUpload.error) {
      console.error("Erro no upload:", originalUpload.error || thumbUpload.error);

      await supabase.storage
        .from("certificates")
        .remove([fileName, thumbname]);

      return res.status(500).json({ error: "Erro ao fazer upload do arquivo" });
    }

    // Captura as URLs públicas geradas no Supabase Storage
    const { data: imageData } = supabase.storage
      .from("certificates")
      .getPublicUrl(fileName);

    const { data: thumbData } = supabase.storage
      .from("certificates")
      .getPublicUrl(thumbname);
    
    if (!imageData?.publicUrl || !thumbData?.publicUrl) {
      return res.status(500).json({ error: "Erro ao obter URLs do arquivo" });
    }

    try {
      // Persistência relacional final no banco de dados
      const result = await pool.query(
        "INSERT INTO certificates (title, image_path, thumbnail_path, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
        [name, imageData.publicUrl, thumbData.publicUrl, user.id]
      );

      res.json(result.rows[0]);

    } catch (dbError) {
      console.error("Erro no banco, rollback do storage...");

      // Rollback Estratégico: Se o SQL falhar, remove as imagens do Bucket para não poluir o Storage
      await supabase.storage
        .from("certificates")
        .remove([fileName, thumbname]);

      return res.status(500).json({ error: "Erro ao salvar certificado" });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar certificado" });
  }
});

/**
 * ROUTE: GET /certificates
 * RESPONSIBILITY: Retornar a coleção completa de modelos de certificados pertencentes exclusivamente ao usuário requisitante.
 */
app.get("/certificates", authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const certResult = await pool.query(
      "SELECT * FROM certificates WHERE user_id = $1 ORDER BY id DESC",
      [user.id]
    );

    res.json(certResult.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar certificados" });
  }
});

// ==========================================================================
// ROTAS DE CONSULTA DE MODELOS ESPECÍFICOS
// ==========================================================================

/**
 * ROUTE: GET /certificates/:id
 * RESPONSIBILITY: Localizar e retornar os metadados de um modelo de certificado específico.
 * SECURITY: Valida se o ID é numérico e restringe o SELECT estritamente ao user_id do token autenticado.
 */
app.get("/certificates/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validação de Entrada: Impede falhas de casting e SQL Injection validando o formato do parâmetro
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const email = req.user.email;

    // Resolução de Dependência: Localiza a Primary Key interna do usuário associado
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Escopo Seguro: Garante que um usuário não consiga acessar modelos pertencentes a terceiros
    const certResult = await pool.query(
      "SELECT * FROM certificates WHERE id = $1 AND user_id = $2",
      [id, user.id]
    );

    if (certResult.rows.length === 0) {
      return res.status(404).json({ error: "Certificado não encontrado" });
    }

    res.json(certResult.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar certificado" });
  }
});

// ==========================================================================
// ROTAS DE GERENCIAMENTO DE PROJETOS (WORKSPACES DE EDIÇÃO)
// ==========================================================================

/**
 * ROUTE: POST /projects
 * RESPONSIBILITY: Salvar as configurações e estados de customização do editor de certificados.
 * Efetua a serialização de arrays/objetos complexos para strings JSON e executa uma limpeza automática
 * na tabela mantendo estritamente os 3 projetos salvos mais recentes (Lógica de Histórico FIFO).
 */
app.post("/projects", authMiddleware, async (req, res) => {
  try {
    const { nomesLista, textoCorpo, estilos, certificadoId, posicoes } = req.body;
    const email = req.user.email;

    const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    const user = userResult.rows[0];

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    // Inserção Relacional: Mapeia dados tipados e converte estruturas dinâmicas em JSON string
    const result = await pool.query(
      `INSERT INTO projects (
        user_id, certificate_id, nomes_lista, texto_corpo,
        cor_nome, fonte_nome, tamanho_nome,
        cor_corpo, fonte_corpo, tamanho_corpo,
        posicao_nome, posicao_corpo
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        user.id,
        certificadoId,
        JSON.stringify(nomesLista), 
        textoCorpo,
        estilos.corNome,
        estilos.fonteNome,
        estilos.tamanhoNome,
        estilos.corCorpo,
        estilos.fonteCorpo,
        estilos.tamanhoCorpo,
        JSON.stringify(posicoes.nome),
        JSON.stringify(posicoes.corpo)
      ]
    );

    // Auditoria de Limpeza: Busca a lista completa de IDs do usuário ordenados por modificação recente
    const projectsResult = await pool.query(
      `
      SELECT id
      FROM projects
      WHERE user_id = $1
      ORDER BY updated_at DESC
      `,
      [user.id]
    );

    const projects = projectsResult.rows;

    // Manutenção do Banco: Se ultrapassar a cota de 3 registros, remove os históricos excedentes (mais antigos)
    if (projects.length > 3) {
      const idsParaRemover = projects
        .slice(3)
        .map(project => project.id);

      // Executa o descarte em lote utilizando o operador ANY para otimizar a transação SQL
      await pool.query(
        `
        DELETE FROM projects
        WHERE id = ANY($1::int[])
        `,
        [idsParaRemover]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar projeto" });
  }
});

/**
 * ROUTE: GET /projects
 * RESPONSIBILITY: Retornar a esteira com os 3 projetos mais recentes do usuário.
 * PATTERN: Executa uma query otimizada contendo um INNER JOIN para acoplar os dados visuais
 * e caminhos de arquivos de imagem (thumbnail) pertencentes ao certificado base associado.
 */
app.get("/projects", authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Query de Agregação Relacional (Projetos + Certificados) com limite estrito de 3 linhas
    const projectsResult = await pool.query(
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
      [user.id]
    );

    res.json(projectsResult.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar projetos" });
  }
});

/**
 * ROUTE: GET /projects/:id
 * RESPONSIBILITY: Hidratar o workspace do editor carregando todas as configurações de um projeto salvo específico.
 * PATTERN: Retorna a linha do projeto injetando os caminhos da imagem original e da miniatura via JOIN.
 */
app.get("/projects/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const email = req.user.email;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Busca detalhada com validação estrita de posse (p.user_id) para evitar vazamento de dados
    const projectResult = await pool.query(
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
      [id, user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: "Projeto não encontrado" });
    }

    res.json(projectResult.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar projeto" });
  }
});

// ==========================================================================
// ROTAS DE ATUALIZAÇÃO E PERSISTÊNCIA CONTINUA (PUT)
// ==========================================================================

/**
 * ROUTE: PUT /projects/:id
 * RESPONSIBILITY: Atualizar de forma integral o estado de edição do canvas de um projeto existente.
 * PERFORMANCE: Executa a validação de propriedade e o UPDATE em uma transação atômica de passo único.
 */
app.put("/projects/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { nomesLista, textoCorpo, estilos, posicoes } = req.body;
    const email = req.user.email;

    const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    const user = userResult.rows[0];

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    // Modificação Atômica: Injeta o timestamp explícito via NOW() diretamente no banco de dados
    const updatedProject = await pool.query(
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
        user.id
      ]
    );

    // Validação de Impacto: Garante retorno caso o ID pertença a outro usuário ou não exista
    if (updatedProject.rows.length === 0) {
      return res.status(404).json({ error: "Projeto não encontrado ou sem permissão" });
    }

    res.json(updatedProject.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar projeto" });
  }
});

// ==========================================================================
// ROTAS DE DELEÇÃO E LIMPEZA ASSÍNCRONA (DELETE)
// ==========================================================================

/**
 * ROUTE: DELETE /certificates/:id
 * RESPONSIBILITY: Remover de forma definitiva um modelo de certificado do ecossistema.
 * FLOW: Localiza as strings de URL, isola os nomes internos dos arquivos via RegExp implícita,
 * purga os blobs físicos no Supabase Storage e, em seguida, expurga a linha relacional no SQL.
 */
app.delete("/certificates/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const email = req.user.email;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Busca preliminar para capturar as referências de imagem do storage antes do descarte relacional
    const certResult = await pool.query(
      "SELECT * FROM certificates WHERE id = $1 AND user_id = $2",
      [id, user.id]
    );

    if (certResult.rows.length === 0) {
      return res.status(404).json({ error: "Certificado não encontrado" });
    }

    const cert = certResult.rows[0];

    /**
     * HELPER FUNCTION: extractPath
     * DESCRIPTION: Instancia uma interface nativa de URL e divide o caminho estático 
     * para reter estritamente a chave do objeto (filename) dentro do bucket de certificados.
     */
    const extractPath = (urlString) => {
      try {
        const url = new URL(urlString);
        const parts = url.pathname.split("/certificates/");
        return parts.length > 1 ? parts[1] : null;
      } catch {
        return null;
      }
    };

    const filesToDelete = [];
    const originalPath = extractPath(cert.image_path);
    const thumbPath = extractPath(cert.thumbnail_path);

    if (originalPath) filesToDelete.push(originalPath);
    if (thumbPath) filesToDelete.push(thumbPath);

    // Expulsão Física: Deleta concorrentemente do bucket os arquivos originais e miniaturas
    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from("certificates")
        .remove(filesToDelete);

      if (deleteError) {
        console.error("Erro ao deletar arquivos do storage:", deleteError);
      }
    }

    // Expulsão Lógica: Remove a restrição relacional na tabela de certificados do banco PostgreSQL
    await pool.query(
      "DELETE FROM certificates WHERE id = $1 AND user_id = $2",
      [id, user.id]
    );

    res.json({ message: "Deletado com sucesso" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar" });
  }
});

// ==========================================================================
// SUBSISTEMA DE MONITORAMENTO E INICIALIZAÇÃO DA PORTA
// ==========================================================================

// Rota pública de Health Check utilizada pelo serviço da Render para monitoramento de Uptime (Ping)
app.get("/ping", (req, res) => {
  res.json({ ok: true });
});

// Injeção dinâmica de porta do container cloud ou fallback local de desenvolvimento
const PORT = process.env.PORT || 3000;

// Escuta explícita ligando todas as interfaces IP (0.0.0.0), obrigatória para roteamento em nuvem
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

