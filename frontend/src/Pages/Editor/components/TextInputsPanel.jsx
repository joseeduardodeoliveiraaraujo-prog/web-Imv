const TextInputsPanel = ({ model }) => (
  <>
    <div className="control-group">
      <label>Lista de Nomes (Um por linha)</label>
      <textarea
        className="editor-input bulk-area"
        placeholder="Cole aqui a lista de nomes...&#10;Aperte Enter para cada novo nome"
        value={model.bulkText}
        onChange={model.handleBulkNames}
      />
    </div>

    <div className="control-group">
      <label className="label-dinamico">
        {model.indexEditando !== null
          ? `Texto para: ${model.nomesLista[model.indexEditando]?.nome}`
          : "Texto do Certificado (Global)"}
      </label>
      <textarea
        className={`editor-input bulk-area ${
          model.indexEditando !== null ? "input-individual" : ""
        }`}
        placeholder="Ex: participou do evento realizado em..."
        value={
          model.indexEditando !== null
            ? model.nomesLista[model.indexEditando].overrides.textoCorpo ||
              model.textoCorpo
            : model.textoCorpo
        }
        onChange={(event) =>
          model.updateStyle(
            "textoCorpo",
            event.target.value,
            model.setTextoCorpo
          )
        }
      />
      {model.indexEditando !== null && (
        <button
          onClick={() => model.setIndexEditando(null)}
          className="btn-voltar-global"
        >
          ← Voltar para edição global
        </button>
      )}
    </div>
  </>
);

export default TextInputsPanel;
