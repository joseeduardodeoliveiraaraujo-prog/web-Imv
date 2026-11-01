import Select from "react-select";
import { CUSTOM_SELECT_STYLES, FONT_OPTIONS } from "../constants/editor";
import FontSizeControl from "./FontSizeControl";

const StylePanel = ({ itemSelecionado, model, mode }) => (
  <>
    {itemSelecionado === "nome" && (
      <div className="control-group">
        {(mode === "aparencia" || !mode) && (
          <>
            <label>Cor do Nome</label>
            <input
              type="color"
              className="editor-input input-color-picker"
              value={model.corNome}
              onChange={(event) => model.setCorNome(event.target.value)}
            />
          </>
        )}

        {(mode === "tipografia" || !mode) && (
          <>
            <label>Fonte do Nome</label>
            <Select
              options={FONT_OPTIONS}
              styles={CUSTOM_SELECT_STYLES}
              value={FONT_OPTIONS.flatMap((group) => group.options).find(
                (option) => option.value === model.fonteNome
              )}
              onChange={(selected) => model.setFonteNome(selected.value)}
              isSearchable={false}
              placeholder="Selecione uma fonte..."
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
            />

            <label>Tamanho da Fonte</label>
            <FontSizeControl
              value={model.tamanhoNome}
              onChange={model.setTamanhoNome}
            />
          </>
        )}
      </div>
    )}

    {itemSelecionado === "corpo" && (
      <div className="control-group">
        {(mode === "aparencia" || !mode) && (
          <>
            <label>Cor do Texto</label>
            <input
              type="color"
              className="editor-input input-color-picker"
              value={model.corCorpo}
              onChange={(event) => model.setCorCorpo(event.target.value)}
            />
          </>
        )}

        {(mode === "tipografia" || !mode) && (
          <>
            <label>Fonte do Texto</label>
            <Select
              options={FONT_OPTIONS}
              styles={CUSTOM_SELECT_STYLES}
              value={FONT_OPTIONS.flatMap((group) => group.options).find(
                (option) => option.value === model.fonteCorpo
              )}
              onChange={(selected) => model.setFonteCorpo(selected.value)}
              isSearchable={false}
              placeholder="Selecione uma fonte..."
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
            />

            <label>Tamanho da Fonte Corpo</label>
            <FontSizeControl
              value={model.tamanhoCorpo}
              onChange={model.setTamanhoCorpo}
            />
          </>
        )}
      </div>
    )}

    {itemSelecionado === null && (
      <div className="control-group">
        <p className="inspector-empty">
          Selecione um elemento no certificado para editar tipografia ou aparência.
        </p>
      </div>
    )}
  </>
);

export default StylePanel;
