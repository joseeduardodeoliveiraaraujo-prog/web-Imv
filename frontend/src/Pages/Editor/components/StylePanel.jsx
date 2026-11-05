import Select from "react-select";
import { CUSTOM_SELECT_STYLES, FONT_OPTIONS } from "../constants/editor";
import FontSizeControl from "./FontSizeControl";

const ALL_FONTS = FONT_OPTIONS.flatMap((group) => group.options);
const findFont = (value) => ALL_FONTS.find((option) => option.value === value);
const menuPortalTarget = typeof document !== "undefined" ? document.body : null;

const FIELDS = {
  nome: {
    colorLabel: "Cor do Nome",
    fontLabel: "Fonte do Nome",
    sizeLabel: "Tamanho da Fonte",
    color: "corNome",
    setColor: "setCorNome",
    font: "fonteNome",
    setFont: "setFonteNome",
    size: "tamanhoNome",
    setSize: "setTamanhoNome",
  },
  corpo: {
    colorLabel: "Cor do Texto",
    fontLabel: "Fonte do Texto",
    sizeLabel: "Tamanho da Fonte Corpo",
    color: "corCorpo",
    setColor: "setCorCorpo",
    font: "fonteCorpo",
    setFont: "setFonteCorpo",
    size: "tamanhoCorpo",
    setSize: "setTamanhoCorpo",
  },
};

const StylePanel = ({ itemSelecionado, model, mode }) => {
  const field = FIELDS[itemSelecionado];

  if (!field) {
    return (
      <div className="control-group">
        <p className="inspector-empty">
          Selecione um elemento no certificado para editar tipografia ou aparência.
        </p>
      </div>
    );
  }

  const ids = {
    color: `style-${itemSelecionado}-color`,
    font: `style-${itemSelecionado}-font`,
    size: `style-${itemSelecionado}-size`,
  };

  return (
    <div className="control-group">
      {(mode === "aparencia" || !mode) && (
        <>
          <label htmlFor={ids.color}>{field.colorLabel}</label>
          <input
            id={ids.color}
            type="color"
            className="editor-input input-color-picker"
            value={model[field.color]}
            onChange={(event) => model[field.setColor](event.target.value)}
          />
        </>
      )}

      {(mode === "tipografia" || !mode) && (
        <>
          <label htmlFor={ids.font}>{field.fontLabel}</label>
          <Select
            inputId={ids.font}
            options={FONT_OPTIONS}
            styles={CUSTOM_SELECT_STYLES}
            value={findFont(model[field.font])}
            onChange={(selected) => model[field.setFont](selected.value)}
            isSearchable={false}
            placeholder="Selecione uma fonte..."
            menuPortalTarget={menuPortalTarget}
            menuPosition="fixed"
          />

          <label htmlFor={ids.size}>{field.sizeLabel}</label>
          <FontSizeControl
            id={ids.size}
            label={field.sizeLabel}
            value={model[field.size]}
            onChange={model[field.setSize]}
          />
        </>
      )}
    </div>
  );
};

export default StylePanel;
