import { describe, it, expect } from "vitest";
import pkg from "pg";
import { parseTimestampAsUtc } from "../src/config/database.js";

describe("parser de TIMESTAMP (sem fuso)", () => {
  it("interpreta o valor do banco como UTC, independente do fuso do servidor", () => {
    expect(parseTimestampAsUtc("2026-11-05 05:07:00").toISOString()).toBe(
      "2026-11-05T05:07:00.000Z"
    );
    expect(parseTimestampAsUtc("2026-11-05 05:07:00.296").toISOString()).toBe(
      "2026-11-05T05:07:00.296Z"
    );
  });

  it("mantém valores especiais que não são datas", () => {
    expect(parseTimestampAsUtc("infinity")).toBe("infinity");
  });

  it("está registrado no pg para o tipo TIMESTAMP (OID 1114)", () => {
    const parser = pkg.types.getTypeParser(1114);
    expect(parser("2026-01-01 00:00:00").toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});
