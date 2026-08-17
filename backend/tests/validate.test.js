import { describe, it, expect } from "vitest";
import {
  validate,
  createUserSchema,
  createCertificateSchema,
  idParamSchema,
  createProjectSchema,
} from "../middleware/validate.js";

describe("validate middleware", () => {
  describe("createUserSchema", () => {
    it("deve aceitar um nome válido", () => {
      const result = validate(createUserSchema, { name: "Eduardo" });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe("Eduardo");
    });

    it("deve rejeitar nome com menos de 3 caracteres", () => {
      const result = validate(createUserSchema, { name: "Ed" });
      expect(result.success).toBe(false);
      expect(result.errors).toContain("Nome deve ter pelo menos 3 caracteres");
    });

    it("deve rejeitar nome vazio", () => {
      const result = validate(createUserSchema, { name: "" });
      expect(result.success).toBe(false);
    });

    it("deve fazer trim no nome", () => {
      const result = validate(createUserSchema, { name: "  Eduardo  " });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe("Eduardo");
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
  });
});
