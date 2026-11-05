import { describe, expect, it } from "vitest";
import { validateUploadFile } from "../hooks/useCertificateUpload";
import {
  countCreatedThisMonth,
  formatDate,
  formatLastModified,
  getExtension,
  getRequestErrorMessage,
} from "./homeFormatters";

describe("homeFormatters", () => {
  it("formatDate trata vazio e datas inválidas", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("xx")).toBe("—");
    expect(formatDate("2026-03-15T12:00:00")).toBe("15/03/2026");
  });

  it("getExtension normaliza JPEG e limita o tamanho", () => {
    expect(getExtension("a.jpeg")).toBe("JPG");
    expect(getExtension("a.png")).toBe("PNG");
    expect(getExtension("sem-extensao")).toBe("IMG");
  });

  it("formatLastModified mostra 'Hoje' com hora para o dia atual", () => {
    const now = new Date("2026-03-15T18:00:00");
    expect(formatLastModified("2026-03-15T09:05:00", now)).toBe("Hoje, 09:05");
    expect(formatLastModified("2026-03-10T09:05:00", now)).toBe("10/03/2026");
    expect(formatLastModified(undefined, now)).toBe("—");
  });

  it("countCreatedThisMonth conta só o mês e ano atuais", () => {
    const now = new Date("2026-03-15T12:00:00");
    const certs = [
      { createdAtRaw: "2026-03-01T10:00:00" },
      { createdAtRaw: "2026-02-28T10:00:00" },
      { createdAtRaw: "2025-03-10T10:00:00" },
      { createdAtRaw: null },
    ];
    expect(countCreatedThisMonth(certs, now)).toBe(1);
  });

  it("getRequestErrorMessage destaca o rate limit", () => {
    expect(getRequestErrorMessage({ status: 429 }, "x")).toMatch(/Muitas requisições/);
    expect(getRequestErrorMessage({ status: 500 }, "padrão")).toBe("padrão");
  });

  it("validateUploadFile valida tipo e tamanho", () => {
    expect(validateUploadFile({ type: "image/gif", size: 10 })).toMatch(/Formato inválido/);
    expect(validateUploadFile({ type: "image/png", size: 6 * 1024 * 1024 })).toMatch(/5 MB/);
    expect(validateUploadFile({ type: "image/jpeg", size: 1024 })).toBeNull();
  });
});
