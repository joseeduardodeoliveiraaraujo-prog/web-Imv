export const DEFAULT_NAME_TEXT = "Nome do Participante";

export const DEFAULT_BODY_TEXT =
  "Participou com êxito do evento [Nome do Evento], realizado no dia [Data], com carga horária de [X] horas.";

export const MAX_PREVIEW_ITEMS = 20;

export const FONT_OPTIONS = [
  {
    label: "Sans-Serif (Modernas)",
    options: [
      { value: "Inter", label: "Inter" },
      { value: "Poppins", label: "Poppins" },
      { value: "Montserrat", label: "Montserrat" },
      { value: "KoHo", label: "KoHo" },
      { value: "Roboto", label: "Roboto" },
      { value: "Raleway", label: "Raleway" },
    ],
  },
  {
    label: "Serif (Elegantes)",
    options: [
      { value: "Cinzel", label: "Cinzel" },
      { value: "Playfair Display", label: "Playfair Display" },
      { value: "Libre Baskerville", label: "Libre Baskerville" },
      { value: "Lora", label: "Lora" },
      { value: "Merriweather", label: "Merriweather" },
      { value: "Cormorant Garamond", label: "Cormorant Garamond" },
      { value: "EB Garamond", label: "EB Garamond" },
    ],
  },
];

export const CUSTOM_SELECT_STYLES = {
  control: (provided, state) => ({
    ...provided,
    background: state.isFocused ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.2)",
    borderColor: state.isFocused ? "#7dd3fc" : "rgba(255, 255, 255, 0.08)",
    borderRadius: "8px",
    padding: "2px",
    cursor: "pointer",
    transition: "all 0.2s",
    "&:hover": {
      background: "rgba(255, 255, 255, 0.08)",
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
  }),
  menu: (provided) => ({
    ...provided,
    background: "#1e293b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    overflow: "hidden",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "rgba(56, 189, 248, 0.1)" : "transparent",
    color: state.isFocused ? "#fff" : "#94a3b8",
    cursor: "pointer",
    padding: "10px 15px",
  }),
  singleValue: (provided) => ({ ...provided, color: "white" }),
  groupHeading: (provided) => ({
    ...provided,
    color: "#38bdf8",
    fontSize: "0.7rem",
    textTransform: "uppercase",
  }),
};
