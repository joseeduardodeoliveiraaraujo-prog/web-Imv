const FontSizeControl = ({ value, onChange }) => (
  <div className="font-size-control">
    <span className="size-icon small">A</span>

    <input
      type="range"
      min="20"
      max="150"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="font-range-input"
    />

    <span className="size-icon large">A</span>

    <div className="number-wrapper">
      <input
        type="number"
        min="20"
        max="150"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="font-number-input"
      />
      <span className="unit">px</span>
    </div>
  </div>
);

export default FontSizeControl;
