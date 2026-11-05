import { useEffect, useEffectEvent } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

// Pilha de diálogos abertos: só o do topo reage a Tab/Esc.
const openDialogs = [];

const getFocusable = (node) =>
  [...node.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (element) => element.getAttribute("aria-hidden") !== "true"
  );

/**
 * Acessibilidade de diálogos modais: move o foco para dentro ao abrir,
 * mantém o Tab preso no diálogo, fecha com Esc e devolve o foco ao fechar.
 * O foco inicial vai para o elemento com [data-autofocus] ou para o próprio painel.
 */
export const useDialogFocus = (ref, { onEscape, active = true } = {}) => {
  const handleEscape = useEffectEvent(() => onEscape?.());

  useEffect(() => {
    const node = ref.current;
    if (!active || !node) return undefined;

    const previouslyFocused = document.activeElement;
    openDialogs.push(node);

    const initial = node.querySelector("[data-autofocus]") || node;
    initial.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (openDialogs[openDialogs.length - 1] !== node) return;

      if (event.key === "Escape") {
        event.preventDefault();
        handleEscape();
        return;
      }

      if (event.key !== "Tab") return;

      const items = getFocusable(node);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && (current === first || current === node)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const index = openDialogs.lastIndexOf(node);
      if (index !== -1) openDialogs.splice(index, 1);

      if (
        previouslyFocused instanceof HTMLElement &&
        document.contains(previouslyFocused)
      ) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [ref, active]);
};
