import { useSyncExternalStore } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";
import { getToasts, subscribeToasts, toast } from "./toastStore";
import "./Toast.css";

const ICONS = {
  success: FaCheckCircle,
  error: FaExclamationCircle,
  info: FaInfoCircle,
};

const Toaster = () => {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts);

  return (
    <div className="toast-region" aria-live="polite" aria-relevant="additions">
      {toasts.map(({ id, type, message }) => {
        const Icon = ICONS[type];

        return (
          <div
            key={id}
            className={`toast toast--${type}`}
            role={type === "error" ? "alert" : "status"}
          >
            <Icon className="toast-icon" aria-hidden="true" />
            <p className="toast-message">{message}</p>
            <button
              type="button"
              className="toast-close"
              onClick={() => toast.dismiss(id)}
              aria-label="Fechar notificação"
            >
              <FaTimes aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toaster;
