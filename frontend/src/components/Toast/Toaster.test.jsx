import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Toaster from "./Toaster";
import { toast } from "./toastStore";

describe("Toaster", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => vi.runAllTimers());
    vi.useRealTimers();
  });

  it("mostra sucesso como status e erro como alerta", () => {
    render(<Toaster />);

    act(() => {
      toast.success("Projeto salvo.");
      toast.error("Falhou.");
    });

    expect(screen.getByRole("status").textContent).toContain("Projeto salvo.");
    expect(screen.getByRole("alert").textContent).toContain("Falhou.");
  });

  it("some sozinho depois do tempo padrão", () => {
    render(<Toaster />);

    act(() => {
      toast.success("Some logo");
    });
    expect(screen.queryByText("Some logo")).not.toBeNull();

    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByText("Some logo")).toBeNull();
  });

  it("pode ser fechado pelo botão", () => {
    render(<Toaster />);

    act(() => {
      toast.info("Fechar manualmente");
    });
    fireEvent.click(screen.getByRole("button", { name: "Fechar notificação" }));

    expect(screen.queryByText("Fechar manualmente")).toBeNull();
  });
});
