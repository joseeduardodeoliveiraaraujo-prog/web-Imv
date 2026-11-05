import { FONT_OPTIONS } from "../constants/editor";

let fontLinkPromise = null;
let fontLinkLoaded = false;

export const areEditorFontsLoaded = () => fontLinkLoaded;

/** true quando as duas fontes já podem ser usadas no canvas sem esperar. */
export const areFontsReady = (styles) =>
  fontLinkLoaded &&
  document.fonts.check(`${styles.tamanhoNome}px "${styles.fonteNome}"`) &&
  document.fonts.check(`${styles.tamanhoCorpo}px "${styles.fonteCorpo}"`);

export const loadSelectedFonts = async (styles) => {
  await loadEditorFonts();
  await Promise.all([
    document.fonts.load(`${styles.tamanhoNome}px "${styles.fonteNome}"`),
    document.fonts.load(`${styles.tamanhoCorpo}px "${styles.fonteCorpo}"`),
  ]).catch(() => []);
};

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
    link.onload = () => {
      fontLinkLoaded = true;
      resolve();
    };
    link.onerror = () => {
      console.error("Erro ao carregar fontes do editor");
      fontLinkLoaded = true;
      resolve();
    };

    document.head.appendChild(link);
  });

  return fontLinkPromise;
};
