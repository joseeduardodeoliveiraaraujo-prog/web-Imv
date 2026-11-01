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
  container: (provided) => ({
    ...provided,
    position: "relative",
    width: "100%",
  }),
  control: (provided, state) => ({
    ...provided,
    background: state.isFocused ? "rgba(0, 0, 0, 0.34)" : "rgba(0, 0, 0, 0.3)",
    borderColor: state.isFocused ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.15)",
    borderRadius: "10px",
    padding: "2px",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(255, 255, 255, 0.08)" : "none",
    "&:hover": {
      background: "rgba(0, 0, 0, 0.34)",
      borderColor: "rgba(255, 255, 255, 0.24)",
    },
  }),
  menu: (provided) => ({
    ...provided,
    position: "absolute",
    top: "100%",
    zIndex: 9999,
    background: "rgba(24, 24, 27, 0.95)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "12px",
    overflow: "hidden",
    marginTop: "8px",
    boxShadow: "0 40px 80px -60px rgba(0, 0, 0, 0.95)",
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 10000,
  }),
  menuList: (provided) => ({
    ...provided,
    padding: "6px",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "rgba(255, 255, 255, 0.08)" : "transparent",
    color: "#ffffff",
    cursor: "pointer",
    padding: "10px 12px",
    borderRadius: "8px",
  }),
  singleValue: (provided) => ({ ...provided, color: "#ffffff" }),
  groupHeading: (provided) => ({
    ...provided,
    color: "rgba(226, 232, 240, 0.6)",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    padding: "8px 12px 6px",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: "rgba(255, 255, 255, 0.7)",
  }),
};
