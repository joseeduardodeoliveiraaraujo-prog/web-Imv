const formatTime = (date) =>
  date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const getStatus = ({ isSaving, isDirty, lastSavedAt, isSavedProject }) => {
  if (isSaving) return { tone: "saving", text: "Salvando..." };
  if (isDirty) return { tone: "dirty", text: "Alterações não salvas" };
  if (lastSavedAt) return { tone: "saved", text: `Salvo às ${formatTime(lastSavedAt)}` };
  if (isSavedProject) return { tone: "saved", text: "Tudo salvo" };
  return null;
};

const SaveStatus = (props) => {
  const status = getStatus(props);

  return (
    <span className="save-status" role="status" aria-live="polite">
      {status && (
        <>
          <span className={`save-status-dot save-status-dot--${status.tone}`} aria-hidden="true" />
          <span className="save-status-text">{status.text}</span>
        </>
      )}
    </span>
  );
};

export default SaveStatus;
