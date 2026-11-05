import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listCertificates: vi.fn(),
  listProjects: vi.fn(),
  ensureUserSynced: vi.fn(),
}));

vi.mock("../../../services/certificatesApi", () => ({
  listCertificates: mocks.listCertificates,
}));
vi.mock("../../../services/projectsApi", () => ({
  listProjects: mocks.listProjects,
}));
vi.mock("../../../services/usersApi", async () => {
  const actual = await vi.importActual("../../../services/usersApi");
  return { ...actual, ensureUserSynced: mocks.ensureUserSynced };
});

const { useHomeData } = await import("./useHomeData");

const user = { getIdToken: vi.fn(async () => "token") };
const notFound = () => Promise.reject(Object.assign(new Error("404"), { status: 404 }));

const CERTS = [
  { id: 1, title: "Modelo A.png", thumbnail_path: "t1", image_path: "i1", created_at: "2026-01-01" },
  { id: 2, title: "Modelo B.jpg", thumbnail_path: "t2", image_path: "i2", created_at: "2026-01-02" },
];
const PROJECTS = [
  { id: 10, certificate_id: 1, title: "Modelo A.png", updated_at: "2026-01-03" },
  { id: 11, certificate_id: 2, title: "Modelo B.jpg", updated_at: "2026-01-02" },
];

describe("useHomeData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.ensureUserSynced.mockResolvedValue(null);
    mocks.listCertificates.mockResolvedValue(CERTS);
    mocks.listProjects.mockResolvedValue(PROJECTS);
  });

  it("carrega modelos formatados e projetos recentes", async () => {
    const { result } = renderHook(() => useHomeData(user));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.certificates.map((cert) => cert.name)).toEqual([
      "Modelo A.png",
      "Modelo B.jpg",
    ]);
    expect(result.current.certificates[1].extension).toBe("JPG");
    expect(result.current.recentes).toEqual(PROJECTS);
    expect(result.current.loadError).toBe("");
  });

  it("após 404 espera a sincronização do usuário e tenta de novo", async () => {
    mocks.listCertificates.mockImplementationOnce(notFound);
    const { result } = renderHook(() => useHomeData(user));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mocks.listCertificates).toHaveBeenCalledTimes(2);
    expect(result.current.certificates).toHaveLength(2);
  });

  it("mostra a mensagem de e-mail vinculado quando a sincronização retorna 409", async () => {
    mocks.ensureUserSynced.mockRejectedValue(Object.assign(new Error("409"), { status: 409 }));
    mocks.listCertificates.mockImplementation(notFound);
    mocks.listProjects.mockImplementation(notFound);

    const { result } = renderHook(() => useHomeData(user));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).toMatch(/já está vinculado a outro cadastro/);
  });

  it("removeCertificate também remove os projetos recentes desse modelo", async () => {
    const { result } = renderHook(() => useHomeData(user));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.removeCertificate(1));

    expect(result.current.certificates.map((cert) => cert.id)).toEqual([2]);
    expect(result.current.recentes.map((project) => project.id)).toEqual([11]);
  });
});
