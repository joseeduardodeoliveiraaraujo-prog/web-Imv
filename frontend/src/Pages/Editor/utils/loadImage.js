const pending = new Map();
const loaded = new Map();

/**
 * Carrega a imagem do modelo uma única vez por URL.
 * crossOrigin="anonymous" é obrigatório para exportar o canvas (toBlob).
 */
export const loadImage = (src) => {
  if (loaded.has(src)) return Promise.resolve(loaded.get(src));

  if (!pending.has(src)) {
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        loaded.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });

    pending.set(src, promise);
    promise.catch(() => {}).finally(() => pending.delete(src));
  }

  return pending.get(src);
};

/** Retorna a imagem já carregada, sem esperar (ou null). */
export const getLoadedImage = (src) => loaded.get(src) ?? null;
