import { describe, expect, it } from "vitest";
import { getLoginErrorMessage } from "./loginErrors";

describe("getLoginErrorMessage", () => {
  it.each([
    ["auth/invalid-credential", /E-mail ou senha inválidos/],
    ["auth/too-many-requests", /Muitas tentativas/],
    ["auth/network-request-failed", /Sem conexão/],
    ["auth/user-disabled", /desativado/],
    ["qualquer-outro", /Não foi possível entrar/],
  ])("%s", (code, expected) => {
    expect(getLoginErrorMessage({ code })).toMatch(expected);
  });
});
