import { useCallback, useMemo, useState } from "react";
import {
  createTextBoxMeasurer,
} from "../utils/canvasText";
import {
  filterNamesForSave,
  getValidNames,
  mergeNamesWithOverrides,
  namesToBulkText,
  normalizeBulkText,
  parseBulkNames,
} from "../utils/names";

export const useEditorModel = () => {
  const [nomesLista, setNomesLista] = useState([
    { nome: "", overrides: {} },
  ]);
  const [bulkText, setBulkText] = useState("");
  const [corNome, setCorNome] = useState("#000000");
  const [posicaoNome, setPosicaoNome] = useState({ x: 500, y: 300 });
  const [textoCorpo, setTextoCorpo] = useState("");
  const [corCorpo, setCorCorpo] = useState("#000000");
  const [posicaoCorpo, setPosicaoCorpo] = useState({ x: 500, y: 500 });
  const [fonteNome, setFonteNome] = useState("Inter");
  const [fonteCorpo, setFonteCorpo] = useState("Inter");
  const [tamanhoNome, setTamanhoNome] = useState(90);
  const [tamanhoCorpo, setTamanhoCorpo] = useState(40);
  const [indexEditando, setIndexEditando] = useState(null);

  const nomesValidos = useMemo(
    () => getValidNames(nomesLista),
    [nomesLista]
  );

  const textoCorpoBase = useMemo(() => {
    const texto = textoCorpo?.trim();
    return texto && texto.length > 0 ? texto : "";
  }, [textoCorpo]);

  const getCachedTextBox = createTextBoxMeasurer();

  const updateStyle = (property, value, globalSetter) => {
    if (indexEditando !== null) {
      const novaLista = [...nomesLista];

      novaLista[indexEditando] = {
        ...novaLista[indexEditando],
        overrides: {
          ...novaLista[indexEditando].overrides,
          [property]: value,
        },
      };

      setNomesLista(novaLista);
    } else {
      globalSetter(value);
    }
  };

  const handleBulkNames = (event) => {
    const value = normalizeBulkText(event.target.value);
    setBulkText(value);

    const linhas = parseBulkNames(value);
    setNomesLista((prev) => mergeNamesWithOverrides(linhas, prev));
  };

  const applyProject = useCallback((data) => {
    const listaSincronizada = data.nomes_lista || [
      { nome: "", overrides: {} },
    ];
    setNomesLista(listaSincronizada);
    setBulkText(namesToBulkText(listaSincronizada));
    setTextoCorpo(data.texto_corpo || "");
    setCorNome(data.cor_nome || "#000000");
    setFonteNome(data.fonte_nome || "Inter");
    setTamanhoNome(data.tamanho_nome || 90);
    setCorCorpo(data.cor_corpo || "#000000");
    setFonteCorpo(data.fonte_corpo || "Inter");
    setTamanhoCorpo(data.tamanho_corpo || 40);
    setPosicaoNome(data.posicao_nome || { x: 0, y: 0 });
    setPosicaoCorpo(data.posicao_corpo || { x: 0, y: 0 });
  }, []);

  const buildProjectPayload = (certificateId) => ({
    nomesLista: filterNamesForSave(nomesLista),
    textoCorpo,
    estilos: {
      corNome,
      fonteNome,
      tamanhoNome,
      corCorpo,
      fonteCorpo,
      tamanhoCorpo,
    },
    posicoes: {
      nome: {
        x: posicaoNome?.x ?? 0,
        y: posicaoNome?.y ?? 0,
      },
      corpo: {
        x: posicaoCorpo?.x ?? 0,
        y: posicaoCorpo?.y ?? 0,
      },
    },
    certificadoId: certificateId,
  });

  const styles = {
    corNome,
    fonteNome,
    tamanhoNome,
    corCorpo,
    fonteCorpo,
    tamanhoCorpo,
  };

  const positions = {
    nome: posicaoNome,
    corpo: posicaoCorpo,
  };

  return {
    nomesLista,
    bulkText,
    corNome,
    setCorNome,
    posicaoNome,
    setPosicaoNome,
    textoCorpo,
    setTextoCorpo,
    corCorpo,
    setCorCorpo,
    posicaoCorpo,
    setPosicaoCorpo,
    fonteNome,
    setFonteNome,
    fonteCorpo,
    setFonteCorpo,
    tamanhoNome,
    setTamanhoNome,
    tamanhoCorpo,
    setTamanhoCorpo,
    indexEditando,
    setIndexEditando,
    nomesValidos,
    textoCorpoBase,
    getCachedTextBox,
    updateStyle,
    handleBulkNames,
    applyProject,
    buildProjectPayload,
    styles,
    positions,
  };
};
