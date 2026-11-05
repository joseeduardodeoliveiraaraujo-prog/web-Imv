import { z } from "zod";

export const MAX_NOMES_POR_PROJETO = 2000;
export const MAX_TAMANHO_NOME = 200;
export const MAX_TAMANHO_TEXTO = 5000;

const corSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida");

const fonteSchema = (mensagemObrigatoria) =>
  z
    .string()
    .min(1, mensagemObrigatoria)
    .max(100, "Nome de fonte muito longo");

// As colunas de tamanho são INTEGER; o editor permite digitar decimais.
const tamanhoFonteSchema = z.number().min(10).max(300).transform(Math.round);

const textoSchema = z
  .string()
  .max(MAX_TAMANHO_TEXTO, "Texto do corpo muito longo");

const pontoSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const nomeItemSchema = z.object({
  nome: z
    .string()
    .min(1, "Nome não pode ser vazio")
    .max(MAX_TAMANHO_NOME, "Nome muito longo"),
  overrides: z
    .object({
      textoCorpo: textoSchema.optional(),
    })
    .optional()
    .default({}),
});

export const updateProjectSchema = z.object({
  nomesLista: z
    .array(nomeItemSchema)
    .min(1, "Lista de nomes não pode ser vazia")
    .max(MAX_NOMES_POR_PROJETO, "Lista de nomes muito grande"),
  textoCorpo: textoSchema.optional().default(""),
  estilos: z.object({
    corNome: corSchema,
    fonteNome: fonteSchema("Fonte do nome é obrigatória"),
    tamanhoNome: tamanhoFonteSchema,
    corCorpo: corSchema,
    fonteCorpo: fonteSchema("Fonte do corpo é obrigatória"),
    tamanhoCorpo: tamanhoFonteSchema,
  }),
  posicoes: z.object({
    nome: pontoSchema,
    corpo: pontoSchema,
  }),
});

export const createProjectSchema = updateProjectSchema.extend({
  certificadoId: z.number().int().positive(),
});
