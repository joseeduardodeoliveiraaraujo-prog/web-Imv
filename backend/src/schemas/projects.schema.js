import { z } from "zod";

export const createProjectSchema = z.object({
  nomesLista: z
    .array(
      z.object({
        nome: z.string().min(1, "Nome não pode ser vazio"),
        overrides: z.record(z.unknown()).optional().default({}),
      })
    )
    .min(1, "Lista de nomes não pode ser vazia"),
  textoCorpo: z.string().optional().default(""),
  estilos: z.object({
    corNome: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
    fonteNome: z.string().min(1, "Fonte do nome é obrigatória"),
    tamanhoNome: z.number().min(10).max(300),
    corCorpo: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
    fonteCorpo: z.string().min(1, "Fonte do corpo é obrigatória"),
    tamanhoCorpo: z.number().min(10).max(300),
  }),
  certificadoId: z.number().int().positive(),
  posicoes: z.object({
    nome: z.object({
      x: z.number(),
      y: z.number(),
    }),
    corpo: z.object({
      x: z.number(),
      y: z.number(),
    }),
  }),
});

export const updateProjectSchema = z.object({
  nomesLista: z
    .array(
      z.object({
        nome: z.string().min(1, "Nome não pode ser vazio"),
        overrides: z.record(z.unknown()).optional().default({}),
      })
    )
    .min(1, "Lista de nomes não pode ser vazia"),
  textoCorpo: z.string().optional().default(""),
  estilos: z.object({
    corNome: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
    fonteNome: z.string().min(1),
    tamanhoNome: z.number().min(10).max(300),
    corCorpo: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
    fonteCorpo: z.string().min(1),
    tamanhoCorpo: z.number().min(10).max(300),
  }),
  posicoes: z.object({
    nome: z.object({ x: z.number(), y: z.number() }),
    corpo: z.object({ x: z.number(), y: z.number() }),
  }),
});
