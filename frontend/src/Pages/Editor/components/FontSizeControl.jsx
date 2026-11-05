import { useState } from "react";
import { FONT_SIZE_RANGE } from "../constants/editor";

const { min: MIN, max: MAX } = FONT_SIZE_RANGE;

const clamp = (value) => Math.min(MAX, Math.max(MIN, Math.round(value)));

/**
 * O campo numérico guarda um rascunho enquanto o usuário digita:
 * só valores dentro do intervalo são aplicados, e ao sair do campo
 * o valor é ajustado ao limite (apagar o campo não zera o tamanho).
 */
const FontSizeControl = ({ id, label, value, onChange }) => {
  const [draft, setDraft] = useState(null);

  const handleNumberChange = (event) => {
    const raw = event.target.value;
    setDraft(raw);

    const parsed = Number(raw);
    if (raw !== "" && Number.isFinite(parsed) && parsed >= MIN && parsed <= MAX) {
      onChange(Math.round(parsed));
    }
  };

  const handleNumberBlur = () => {
    if (draft === null) return;

    const parsed = Number(draft);
    if (draft !== "" && Number.isFinite(parsed)) {
      onChange(clamp(parsed));
    }

    setDraft(null);
  };

  return (
    <div className="font-size-control">
      <span className="size-icon small" aria-hidden="true">A</span>

      <input
        id={id}
        type="range"
        min={MIN}
        max={MAX}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="font-range-input"
      />

      <span className="size-icon large" aria-hidden="true">A</span>

      <div className="number-wrapper">
        <input
          type="number"
          min={MIN}
          max={MAX}
          value={draft ?? value}
          onChange={handleNumberChange}
          onBlur={handleNumberBlur}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className="font-number-input"
          aria-label={`${label} em pixels`}
        />
        <span className="unit" aria-hidden="true">px</span>
      </div>
    </div>
  );
};

export default FontSizeControl;
