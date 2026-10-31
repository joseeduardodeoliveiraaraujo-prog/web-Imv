import { FONT_OPTIONS } from "../constants/editor";

let fontLinkPromise = null;

const buildFontUrl = () => {
  const families = FONT_OPTIONS.flatMap((group) => group.options)
    .filter((option) => option.value !== "Inter")
    .map((option) => {
      const family = option.value.trim().replace(/\s+/g, "+");
      return `family=${family}:wght@400;700`;
    })
    .join("&");

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
};

export const loadEditorFonts = () => {
  if (fontLinkPromise) return fontLinkPromise;

  fontLinkPromise = new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = buildFontUrl();
    link.onload = () => resolve();
    link.onerror = () => {
      console.error("Erro ao carregar fontes do editor");
      resolve();
    };

    document.head.appendChild(link);
  });

  return fontLinkPromise;
};
