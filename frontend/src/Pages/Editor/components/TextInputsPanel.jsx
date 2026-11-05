const TextInputsPanel = ({ model }) => {
  const isIndividual = model.indexEditando !== null;
  const editingItem = isIndividual ? model.nomesLista[model.indexEditando] : null;

  return (
    <>
      <div className="control-group">
        <label htmlFor="editor-bulk-names">Lista de Nomes (Um por linha)</label>
        <textarea
          id="editor-bulk-names"
          className="editor-input bulk-area"
          placeholder="Cole aqui a lista de nomes...&#10;Aperte Enter para cada novo nome"
          value={model.bulkText}
          onChange={model.handleBulkNames}
          aria-describedby="editor-bulk-count"
        />
        <span id="editor-bulk-count" className="field-hint" aria-live="polite">
          {model.nomesValidos.length === 1
            ? "1 nome na lista"
            : `${model.nomesValidos.length} nomes na lista`}
        </span>
      </div>

      <div className="control-group">
        <label className="label-dinamico" htmlFor="editor-body-text">
          {isIndividual
            ? `Texto para: ${editingItem?.nome}`
            : "Texto do Certificado (Global)"}
        </label>
        <textarea
          id="editor-body-text"
          className={`editor-input bulk-area ${isIndividual ? "input-individual" : ""}`}
          placeholder="Ex: participou do evento realizado em..."
          value={
            isIndividual
              ? editingItem?.overrides?.textoCorpo || model.textoCorpo
              : model.textoCorpo
          }
          onChange={(event) =>
            model.updateStyle("textoCorpo", event.target.value, model.setTextoCorpo)
          }
        />
        {isIndividual && (
          <div className="voltar-global-wrapper">
            <button
              type="button"
              onClick={() => model.setIndexEditando(null)}
              className="btn-voltar-global"
            >
              ← Voltar para edição global
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default TextInputsPanel;
