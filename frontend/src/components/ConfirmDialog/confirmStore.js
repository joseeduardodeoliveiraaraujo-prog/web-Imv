let current = null;
const listeners = new Set();

const emit = () => {
  listeners.forEach((listener) => listener());
};

export const subscribeConfirm = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getConfirm = () => current;

export const resolveConfirm = (value) => {
  if (!current) return;

  const { resolve } = current;
  current = null;
  emit();
  resolve(value);
};

/**
 * Substitui window.confirm por um diálogo acessível no estilo do sistema.
 * Resolve com true (confirmado) ou false (cancelado/Esc/clique fora).
 */
export const confirmDialog = ({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
}) => {
  if (current) resolveConfirm(false);

  return new Promise((resolve) => {
    current = { title, message, confirmLabel, cancelLabel, tone, resolve };
    emit();
  });
};
