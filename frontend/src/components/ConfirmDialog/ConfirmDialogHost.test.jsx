import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ConfirmDialogHost from "./ConfirmDialogHost";
import { confirmDialog } from "./confirmStore";

const open = (options = {}) => {
  let result;
  act(() => {
    result = confirmDialog({
      title: "Excluir modelo?",
      message: "Essa ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      tone: "danger",
      ...options,
    });
  });
  return result;
};

describe("ConfirmDialogHost", () => {
  it("resolve true ao confirmar", async () => {
    render(<ConfirmDialogHost />);
    const result = open();

    expect(screen.getByRole("alertdialog", { name: "Excluir modelo?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    await expect(result).resolves.toBe(true);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("resolve false com Esc e começa com o foco em Cancelar", async () => {
    render(<ConfirmDialogHost />);
    const result = open();

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.keyDown(document, { key: "Escape" });

    await expect(result).resolves.toBe(false);
  });

  it("resolve false ao clicar fora", async () => {
    render(<ConfirmDialogHost />);
    const result = open();

    fireEvent.click(screen.getByRole("alertdialog").parentElement);

    await expect(result).resolves.toBe(false);
  });

  it("devolve o foco ao elemento de origem ao fechar", async () => {
    render(
      <>
        <button type="button">Origem</button>
        <ConfirmDialogHost />
      </>
    );
    const origin = screen.getByRole("button", { name: "Origem" });
    origin.focus();

    const result = open();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await result;

    expect(document.activeElement).toBe(origin);
  });

  it("mantém o Tab dentro do diálogo", () => {
    render(<ConfirmDialogHost />);
    open();

    const cancel = screen.getByRole("button", { name: "Cancelar" });
    const confirm = screen.getByRole("button", { name: "Excluir" });

    confirm.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(cancel);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(confirm);

    fireEvent.click(cancel);
  });
});
