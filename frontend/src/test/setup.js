import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom não implementa matchMedia; simula uma tela larga (desktop).
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

afterEach(() => {
  cleanup();
});
