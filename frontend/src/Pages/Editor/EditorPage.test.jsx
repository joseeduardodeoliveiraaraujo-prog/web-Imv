import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfirmDialogHost from "../../components/ConfirmDialog/ConfirmDialogHost";
import Toaster from "../../components/Toast/Toaster";
import { installCanvasMock } from "../../test/canvasMock";

const IMAGE = { width: 2000, height: 1000 };

const mocks = vi.hoisted(() => ({
  getCertificate: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
}));

vi.mock("../../services/firebase", () => ({
  auth: { currentUser: { getIdToken: async () => "token" } },
}));
vi.mock("../../services/certificatesApi", () => ({
  getCertificate: mocks.getCertificate,
}));
vi.mock("../../services/projectsApi", () => ({
  getProject: mocks.getProject,
  createProject: mocks.createProject,
  updateProject: mocks.updateProject,
}));
vi.mock("./utils/loadImage", () => ({
  getLoadedImage: () => IMAGE,
  loadImage: async () => IMAGE,
}));
vi.mock("./utils/loadEditorFonts", () => ({
  loadEditorFonts: async () => {},
  loadSelectedFonts: async () => {},
  areFontsReady: () => true,
}));

const { default: EditorPage } = await import("./EditorPage");

const user = { getIdToken: async () => "token" };

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

const renderEditor = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<h1>Página inicial</h1>} />
        <Route path="/editor/:id" element={<EditorPage user={user} />} />
        <Route path="/project/:id" element={<EditorPage user={user} />} />
      </Routes>
      <LocationProbe />
      <Toaster />
      <ConfirmDialogHost />
    </MemoryRouter>
  );

const typeNames = (value) =>
  fireEvent.change(screen.getByLabelText("Lista de Nomes (Um por linha)"), {
    target: { value },
  });

describe("EditorPage (integração)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    installCanvasMock();
    mocks.getCertificate.mockResolvedValue({
      id: 5,
      title: "Modelo Congresso.png",
      image_path: "https://cdn/modelo.png",
    });
    mocks.createProject.mockResolvedValue({ id: 42 });
    mocks.updateProject.mockResolvedValue({ id: 42 });
    mocks.getProject.mockResolvedValue({
      id: 42,
      certificate_id: 5,
      title: "Modelo Congresso.png",
      image_path: "https://cdn/modelo.png",
      nomes_lista: [{ nome: "Ana", overrides: {} }],
      texto_corpo: "Participou",
    });
  });

  it("carrega o modelo, salva o projeto e passa a usar /project/:id sem recarregar", async () => {
    renderEditor("/editor/5");

    expect(await screen.findByRole("heading", { name: "Modelo Congresso.png" })).toBeTruthy();
    expect(screen.getAllByLabelText(/^Certificado 1 de 1/)).toHaveLength(1);

    typeNames("Ana\nBia");
    expect(screen.getByText("Alterações não salvas")).toBeTruthy();
    expect(screen.getAllByLabelText(/^Certificado \d de 2/)).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Salvar projeto" }));

    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/project/42")
    );
    expect(mocks.createProject).toHaveBeenCalledTimes(1);
    expect(mocks.createProject.mock.calls[0][0].nomesLista).toEqual([
      { nome: "Ana", overrides: {} },
      { nome: "Bia", overrides: {} },
    ]);
    expect(await screen.findByText(/^Salvo às/)).toBeTruthy();
    expect(screen.getByText("Projeto salvo.")).toBeTruthy();
    // A troca de rota não refaz a busca (não sobrescreve o que está na tela).
    expect(mocks.getProject).not.toHaveBeenCalled();

    // Segundo salvamento: atualiza o mesmo projeto.
    typeNames("Ana\nBia\nCarlos");
    fireEvent.keyDown(window, { key: "s", ctrlKey: true });
    await waitFor(() => expect(mocks.updateProject).toHaveBeenCalledTimes(1));
    expect(mocks.updateProject.mock.calls[0][0]).toBe(42);
    expect(mocks.createProject).toHaveBeenCalledTimes(1);
  });

  it("pede confirmação ao sair com alterações não salvas", async () => {
    renderEditor("/editor/5");
    await screen.findByRole("heading", { name: "Modelo Congresso.png" });

    typeNames("Ana");
    fireEvent.click(screen.getByRole("button", { name: "Voltar para o início" }));

    expect(await screen.findByRole("alertdialog", { name: "Sair sem salvar?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continuar editando" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(screen.getByTestId("location").textContent).toBe("/editor/5");

    fireEvent.click(screen.getByRole("button", { name: "Voltar para o início" }));
    fireEvent.click(await screen.findByRole("button", { name: "Sair sem salvar" }));

    await waitFor(() => expect(screen.getByTestId("location").textContent).toBe("/"));
  });

  it("sai direto quando não há alterações", async () => {
    renderEditor("/project/42");
    await screen.findByRole("heading", { name: "Modelo Congresso.png" });

    expect(screen.getByText("Tudo salvo")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Voltar para o início" }));

    await waitFor(() => expect(screen.getByTestId("location").textContent).toBe("/"));
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("mostra uma tela de erro clara quando o projeto não existe", async () => {
    mocks.getProject.mockRejectedValue(Object.assign(new Error("404"), { status: 404 }));
    renderEditor("/project/999");

    expect(await screen.findByText(/Este projeto não existe mais/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Voltar para o início" }));
    expect(screen.getByTestId("location").textContent).toBe("/");
  });

  it("permite tentar de novo após falha de rede", async () => {
    mocks.getCertificate
      .mockRejectedValueOnce(new Error("rede"))
      .mockResolvedValueOnce({ id: 5, title: "Modelo", image_path: "https://cdn/m.png" });
    renderEditor("/editor/5");

    fireEvent.click(await screen.findByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByRole("heading", { name: "Modelo" })).toBeTruthy();
  });

  it("em telas pequenas o inspector abre como gaveta acessível", async () => {
    const original = window.matchMedia;
    window.matchMedia = (query) => ({
      ...original(query),
      matches: query === "(max-width: 1080px)",
    });

    try {
      renderEditor("/editor/5");
      await screen.findByRole("heading", { name: "Modelo Congresso.png" });

      const inspector = document.getElementById("editor-inspector");
      expect(inspector.hasAttribute("inert")).toBe(true);

      const toggle = screen.getByRole("button", { name: "Abrir propriedades" });
      // Num navegador o clique já foca o botão; o jsdom não faz isso sozinho.
      toggle.focus();
      fireEvent.click(toggle);

      const drawer = await screen.findByRole("dialog", { name: "Propriedades do certificado" });
      expect(drawer.hasAttribute("inert")).toBe(false);
      expect(drawer.contains(document.activeElement)).toBe(true);

      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() =>
        expect(screen.queryByRole("dialog", { name: "Propriedades do certificado" })).toBeNull()
      );
      expect(document.activeElement).toBe(toggle);
    } finally {
      window.matchMedia = original;
    }
  });

  it("valida antes de exportar e abre o modal com o total", async () => {
    renderEditor("/editor/5");
    await screen.findByRole("heading", { name: "Modelo Congresso.png" });

    fireEvent.click(screen.getByRole("button", { name: "Exportar certificados" }));
    expect(await screen.findByRole("dialog", { name: "Baixar certificados" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /PDF Único/ }));

    expect(await screen.findByText(/Insira ao menos um nome/)).toBeTruthy();

    typeNames("Ana\nBia");
    fireEvent.click(screen.getByRole("button", { name: "Exportar certificados" }));
    expect(screen.getByText("2 certificados serão gerados.")).toBeTruthy();

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Baixar certificados" })).toBeNull());
  });
});
