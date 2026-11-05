import { describe, it, expect } from "vitest";
import {
  validate,
  createUserSchema,
  createCertificateSchema,
  idParamSchema,
  createProjectSchema,
  updateProjectSchema,
} from "../middleware/validate.js";
import {
  MAX_NOMES_POR_PROJETO,
  MAX_TAMANHO_NOME,
  MAX_TAMANHO_TEXTO,
} from "../src/schemas/projects.schema.js";

describe("validate middleware", () => {
  describe("createUserSchema", () => {
    it("deve aceitar um nome válido", () => {
      const result = validate(createUserSchema, { name: "Eduardo" });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe("Eduardo");
    });

    it("deve aceitar nomes curtos vindos do displayName", () => {
      const result = validate(createUserSchema, { name: "Al" });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe("Al");
    });

    it.each([
      ["vazio", { name: "" }],
      ["só com espaços", { name: "   " }],
      ["ausente", {}],
    ])("deve usar o nome padrão quando o nome está %s", (_label, body) => {
      const result = validate(createUserSchema, body);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe("Sem nome");
    });

    it("deve fazer trim no nome", () => {
      const result = validate(createUserSchema, { name: "  Eduardo  " });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe("Eduardo");
    });

    it("deve cortar nomes acima de 100 caracteres em vez de rejeitar", () => {
      const result = validate(createUserSchema, { name: "x".repeat(150) });
      expect(result.success).toBe(true);
      expect(result.data.name).toHaveLength(100);
    });

    it("deve rejeitar nome que não é texto", () => {
      const result = validate(createUserSchema, { name: 123 });
      expect(result.success).toBe(false);
      expect(result.errors).toContain("Nome deve ser um texto");
    });

    it("deve descartar email e uid enviados no body", () => {
      const result = validate(createUserSchema, {
        name: "Eduardo",
        email: "outro@email.com",
        uid: "outro-uid",
      });
      expect(result.data).toEqual({ name: "Eduardo" });
    });
  });

  describe("createCertificateSchema", () => {
    it("deve aceitar nome válido com 3+ caracteres", () => {
      const result = validate(createCertificateSchema, { name: "Cert Evento" });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar nome com menos de 3 caracteres", () => {
      const result = validate(createCertificateSchema, { name: "AB" });
      expect(result.success).toBe(false);
    });
  });

  describe("idParamSchema", () => {
    it("deve aceitar ID numérico válido", () => {
      const result = validate(idParamSchema, { id: "42" });
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(42);
    });

    it("deve rejeitar ID não numérico", () => {
      const result = validate(idParamSchema, { id: "abc" });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar ID vazio", () => {
      const result = validate(idParamSchema, { id: "" });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar ID com caracteres especiais", () => {
      const result = validate(idParamSchema, { id: "1; DROP TABLE users" });
      expect(result.success).toBe(false);
    });
  });

  describe("createProjectSchema", () => {
    const validProject = {
      nomesLista: [{ nome: "João", overrides: {} }],
      textoCorpo: "Participou do evento",
      estilos: {
        corNome: "#000000",
        fonteNome: "Inter",
        tamanhoNome: 90,
        corCorpo: "#333333",
        fonteCorpo: "Roboto",
        tamanhoCorpo: 40,
      },
      certificadoId: 1,
      posicoes: {
        nome: { x: 500, y: 300 },
        corpo: { x: 500, y: 500 },
      },
    };

    it("deve aceitar projeto válido completo", () => {
      const result = validate(createProjectSchema, validProject);
      expect(result.success).toBe(true);
    });

    it("deve rejeitar lista de nomes vazia", () => {
      const result = validate(createProjectSchema, {
        ...validProject,
        nomesLista: [],
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar cor de nome inválida", () => {
      const result = validate(createProjectSchema, {
        ...validProject,
        estilos: { ...validProject.estilos, corNome: "not-a-color" },
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar tamanho de fonte fora do range", () => {
      const result = validate(createProjectSchema, {
        ...validProject,
        estilos: { ...validProject.estilos, tamanhoNome: 5 },
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar nome vazio na lista", () => {
      const result = validate(createProjectSchema, {
        ...validProject,
        nomesLista: [{ nome: "", overrides: {} }],
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar certificadoId negativo", () => {
      const result = validate(createProjectSchema, {
        ...validProject,
        certificadoId: -1,
      });
      expect(result.success).toBe(false);
    });

    it("deve arredondar tamanhos de fonte decimais (colunas INTEGER)", () => {
      const result = validate(createProjectSchema, {
        ...validProject,
        estilos: { ...validProject.estilos, tamanhoNome: 45.6, tamanhoCorpo: 40.2 },
      });
      expect(result.success).toBe(true);
      expect(result.data.estilos.tamanhoNome).toBe(46);
      expect(result.data.estilos.tamanhoCorpo).toBe(40);
    });

    it("deve manter apenas textoCorpo nos overrides", () => {
      const result = validate(createProjectSchema, {
        ...validProject,
        nomesLista: [
          { nome: "João", overrides: { textoCorpo: "Texto", extra: { a: 1 } } },
          { nome: "Maria" },
        ],
      });
      expect(result.success).toBe(true);
      expect(result.data.nomesLista).toEqual([
        { nome: "João", overrides: { textoCorpo: "Texto" } },
        { nome: "Maria", overrides: {} },
      ]);
    });

    it.each([
      ["lista de nomes acima do limite", {
        nomesLista: Array.from({ length: MAX_NOMES_POR_PROJETO + 1 }, () => ({ nome: "A" })),
      }],
      ["nome acima do limite", {
        nomesLista: [{ nome: "x".repeat(MAX_TAMANHO_NOME + 1) }],
      }],
      ["texto do corpo acima do limite", {
        textoCorpo: "x".repeat(MAX_TAMANHO_TEXTO + 1),
      }],
      ["override de texto acima do limite", {
        nomesLista: [{ nome: "A", overrides: { textoCorpo: "x".repeat(MAX_TAMANHO_TEXTO + 1) } }],
      }],
    ])("deve rejeitar %s", (_label, override) => {
      const result = validate(createProjectSchema, { ...validProject, ...override });
      expect(result.success).toBe(false);
    });

    it("updateProjectSchema aceita o mesmo payload sem certificadoId", () => {
      const { certificadoId: _ignored, ...payload } = validProject;
      const result = validate(updateProjectSchema, payload);
      expect(result.success).toBe(true);
      expect(result.data).not.toHaveProperty("certificadoId");
    });
  });
});
