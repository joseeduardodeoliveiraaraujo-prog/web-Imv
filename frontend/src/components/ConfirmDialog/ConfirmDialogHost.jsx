import { useRef, useSyncExternalStore } from "react";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { getConfirm, resolveConfirm, subscribeConfirm } from "./confirmStore";
import "./ConfirmDialog.css";

const ConfirmDialogPanel = ({ dialog }) => {
  const panelRef = useRef(null);
  const cancel = () => resolveConfirm(false);

  useDialogFocus(panelRef, { onEscape: cancel });

  return (
    <div className="confirm-overlay" onClick={cancel} role="presentation">
      <div
        ref={panelRef}
        className="confirm-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="confirm-title" id="confirm-dialog-title">
          {dialog.title}
        </h2>
        <p className="confirm-message" id="confirm-dialog-message">
          {dialog.message}
        </p>

        <div className="confirm-actions">
          <button
            type="button"
            className="confirm-btn confirm-btn--ghost"
            onClick={cancel}
            data-autofocus
          >
            {dialog.cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-btn confirm-btn--${dialog.tone}`}
            onClick={() => resolveConfirm(true)}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfirmDialogHost = () => {
  const dialog = useSyncExternalStore(subscribeConfirm, getConfirm);

  return dialog ? <ConfirmDialogPanel dialog={dialog} /> : null;
};

export default ConfirmDialogHost;
