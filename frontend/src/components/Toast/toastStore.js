const DEFAULT_DURATION = {
  success: 3500,
  info: 4000,
  error: 6500,
};

let toasts = [];
let nextId = 1;
const listeners = new Set();
const timers = new Map();

const emit = () => {
  listeners.forEach((listener) => listener());
};

export const subscribeToasts = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getToasts = () => toasts;

const dismiss = (id) => {
  clearTimeout(timers.get(id));
  timers.delete(id);

  const next = toasts.filter((item) => item.id !== id);
  if (next.length === toasts.length) return;

  toasts = next;
  emit();
};

const show = (type, message, { duration } = {}) => {
  const id = nextId++;
  toasts = [...toasts, { id, type, message }];
  emit();

  const timeout = duration ?? DEFAULT_DURATION[type];
  if (timeout > 0) {
    timers.set(id, setTimeout(() => dismiss(id), timeout));
  }

  return id;
};

/**
 * Notificações não bloqueantes, utilizáveis fora de componentes (hooks e serviços).
 * Renderizadas por <Toaster />, montado uma única vez em App.
 */
export const toast = {
  success: (message, options) => show("success", message, options),
  error: (message, options) => show("error", message, options),
  info: (message, options) => show("info", message, options),
  dismiss,
};
