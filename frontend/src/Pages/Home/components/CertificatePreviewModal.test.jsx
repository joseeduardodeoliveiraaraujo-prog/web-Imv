import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CertificatePreviewModal from "./CertificatePreviewModal";

const CERTIFICATE = {
  id: 1,
  name: "certificado_congresso_brasileiro_de_medicina_veterinaria_2026_versao_final.png",
  extension: "PNG",
  createdAt: "01/03/2026",
  previewUrl: "https://cdn/t.webp",
  originalUrl: "https://cdn/o.png",
};

const setup = () => {
  const handlers = { onClose: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  render(<CertificatePreviewModal certificate={CERTIFICATE} {...handlers} />);
  return handlers;
};

describe("CertificatePreviewModal", () => {
  it("tem um único botão de fechar (o X do cabeçalho)", () => {
    setup();

    expect(screen.getAllByRole("button", { name: "Fechar" })).toHaveLength(1);
    expect(screen.getAllByRole("button").map((button) => button.textContent.trim())).toEqual([
      "",
      "Excluir",
      "Editar Campos",
    ]);
  });

  it("fecha pelo X e pelo Esc, e mantém Excluir e Editar", () => {
    const handlers = setup();

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    fireEvent.click(screen.getByRole("button", { name: "Editar Campos" }));

    expect(handlers.onClose).toHaveBeenCalledTimes(2);
    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
    expect(handlers.onEdit).toHaveBeenCalledTimes(1);
  });
});
