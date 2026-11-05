import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiJson, apiRequest } from "./api";

describe("api", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: 1 }) }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envia JSON com Content-Type e Authorization", async () => {
    await apiRequest("/projects", {
      method: "POST",
      token: "tkn",
      body: { a: 1 },
    });

    const [, options] = fetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer tkn",
    });
    expect(options.body).toBe('{"a":1}');
  });

  it("não define Content-Type para FormData", async () => {
    const form = new FormData();
    await apiRequest("/certificates", { method: "POST", token: "t", body: form });

    const [, options] = fetch.mock.calls[0];
    expect(options.headers).toEqual({ Authorization: "Bearer t" });
    expect(options.body).toBe(form);
  });

  it("apiJson lança erro com status quando a resposta não é ok", async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 429 });

    await expect(
      apiJson("/x", { errorMessage: "Falhou" })
    ).rejects.toMatchObject({ message: "Falhou", status: 429 });
  });

  it("apiJson retorna o corpo JSON", async () => {
    await expect(apiJson("/x")).resolves.toEqual({ ok: 1 });
  });
});
