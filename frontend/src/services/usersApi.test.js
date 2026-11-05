import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock("./api", () => ({ apiRequest: mocks.apiRequest }));

const loadModule = async () => {
  vi.resetModules();
  return import("./usersApi");
};

const makeUser = (uid = "uid-1") => ({
  uid,
  email: `${uid}@x.com`,
  displayName: "Ana",
  getIdToken: vi.fn(async () => "token"),
});

describe("ensureUserSynced", () => {
  beforeEach(() => {
    mocks.apiRequest.mockReset();
    mocks.apiRequest.mockResolvedValue({ ok: true, status: 200 });
  });

  it("faz uma única chamada para chamadas concorrentes do mesmo usuário", async () => {
    const { ensureUserSynced } = await loadModule();
    const user = makeUser();

    await Promise.all([ensureUserSynced(user), ensureUserSynced(user)]);
    await ensureUserSynced(user);

    expect(mocks.apiRequest).toHaveBeenCalledTimes(1);
    expect(mocks.apiRequest.mock.calls[0][0]).toBe("/users");
  });

  it("tenta de novo depois de uma falha", async () => {
    const { ensureUserSynced } = await loadModule();
    const user = makeUser();
    mocks.apiRequest.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(ensureUserSynced(user)).rejects.toThrow();
    await ensureUserSynced(user);

    expect(mocks.apiRequest).toHaveBeenCalledTimes(2);
  });

  it("envia apenas o nome no body e expõe o status do erro", async () => {
    const { ensureUserSynced, getSyncErrorMessage } = await loadModule();
    mocks.apiRequest.mockResolvedValueOnce({ ok: false, status: 409 });

    const error = await ensureUserSynced(makeUser()).catch((caught) => caught);

    expect(mocks.apiRequest.mock.calls[0][1].body).toEqual({ name: "Ana" });
    expect(error.status).toBe(409);
    expect(getSyncErrorMessage(error)).toMatch(/já está vinculado/);
    expect(getSyncErrorMessage({ status: 500 })).toBeNull();
  });

  it("sincroniza de novo quando o usuário muda", async () => {
    const { ensureUserSynced } = await loadModule();

    await ensureUserSynced(makeUser("a"));
    await ensureUserSynced(makeUser("b"));

    expect(mocks.apiRequest).toHaveBeenCalledTimes(2);
  });
});
