export const getValidNames = (names) =>
  names.filter(
    (item) =>
      item &&
      typeof item.nome === "string" &&
      item.nome.trim() !== ""
  );

export const normalizeBulkText = (value) => value.replace(/\r/g, "");

export const parseBulkNames = (value) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

export const mergeNamesWithOverrides = (lines, previousNames) =>
  lines.map((nome, index) => ({
    nome,
    overrides: previousNames[index]?.overrides || {},
  }));

export const namesToBulkText = (names) =>
  names
    .map((item) => item.nome)
    .filter((nome) => nome.trim() !== "")
    .join("\n");

export const filterNamesForSave = (names) =>
  names
    .filter((item) => item.nome && item.nome.trim() !== "")
    .map((item) => ({
      nome: item.nome,
      overrides: item.overrides || {},
    }));

export const resolveBodyText = (item, globalBodyText) =>
  item.overrides?.textoCorpo || globalBodyText;
