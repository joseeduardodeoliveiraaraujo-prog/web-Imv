import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createProject: vi.fn(),
  updateProject: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../../../services/projectsApi", () => ({
  createProject: mocks.createProject,
  updateProject: mocks.updateProject,
}));

vi.mock("../../../components/Toast/toastStore", () => ({ toast: mocks.toast }));

const { useSaveProject } = await import("./useSaveProject");

const makeModel = (overrides = {}) => ({
  nomesLista: [{ nome: "Ana", overrides: {} }],
  snapshot: "snapshot-1",
  buildProjectPayload: vi.fn((certificateId) => ({ certificadoId: certificateId })),
  markSaved: vi.fn(),
  ...overrides,
});

const setup = ({ projectId = null, model = makeModel() } = {}) => {
  const props = {
    user: { getIdToken: vi.fn(async () => "token") },
    certificate: { id: 5 },
    projectId,
    adoptProject: vi.fn(),
    navigate: vi.fn(),
    model,
  };

  const hook = renderHook(() => useSaveProject(props));
  return { hook, props };
};

describe("useSaveProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createProject.mockResolvedValue({ id: 42 });
    mocks.updateProject.mockResolvedValue({ id: 7 });
  });

  it("cliques repetidos criam um único projeto", async () => {
    let resolveCreate;
    mocks.createProject.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      })
    );
    const { hook } = setup();

    let first;
    await act(async () => {
      first = hook.result.current.handleSaveProject();
      hook.result.current.handleSaveProject();
      hook.result.current.handleSaveProject();
    });

    expect(hook.result.current.isSaving).toBe(true);

    await act(async () => {
      resolveCreate({ id: 42 });
      await first;
    });

    expect(mocks.createProject).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isSaving).toBe(false);
  });

  it("após criar, adota o projeto e troca a URL para /project/:id", async () => {
    const { hook, props } = setup();

    await act(() => hook.result.current.handleSaveProject());

    expect(props.adoptProject).toHaveBeenCalledWith(42);
    expect(props.navigate).toHaveBeenCalledWith("/project/42", { replace: true });
    expect(props.model.markSaved).toHaveBeenCalledWith("snapshot-1");
    expect(hook.result.current.lastSavedAt).toBeInstanceOf(Date);
    expect(mocks.toast.success).toHaveBeenCalled();
  });

  it("projeto existente usa PUT e não navega", async () => {
    const { hook, props } = setup({ projectId: 7 });

    await act(() => hook.result.current.handleSaveProject());

    expect(mocks.updateProject).toHaveBeenCalledWith(7, { certificadoId: 5 }, "token");
    expect(mocks.createProject).not.toHaveBeenCalled();
    expect(props.navigate).not.toHaveBeenCalled();
  });

  it("não salva sem nomes e avisa o usuário", async () => {
    const { hook } = setup({ model: makeModel({ nomesLista: [{ nome: " " }] }) });

    await act(() => hook.result.current.handleSaveProject());

    expect(mocks.createProject).not.toHaveBeenCalled();
    expect(mocks.toast.error).toHaveBeenCalledWith(
      "Insira ao menos um nome na lista antes de salvar."
    );
  });

  it("mostra mensagem específica para erro de validação e não marca como salvo", async () => {
    mocks.createProject.mockRejectedValue(Object.assign(new Error("x"), { status: 400 }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { hook, props } = setup();

    await act(() => hook.result.current.handleSaveProject());

    expect(mocks.toast.error.mock.calls[0][0]).toMatch(/confira a lista de nomes/);
    expect(props.model.markSaved).not.toHaveBeenCalled();
    expect(hook.result.current.isSaving).toBe(false);
  });

  it("não registra o payload (dados pessoais) no console", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const { hook } = setup();

    await act(() => hook.result.current.handleSaveProject());

    expect(log).not.toHaveBeenCalled();
  });
});
