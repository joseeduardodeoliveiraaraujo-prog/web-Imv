import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_POSITIONS,
  DEFAULT_STYLES,
} from "../constants/editor";
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

const EMPTY_NAMES = [{ nome: "", overrides: {} }];

const createSnapshot = ({ namesKey, textoCorpo, styles, posicaoNome, posicaoCorpo }) =>
  JSON.stringify([namesKey, textoCorpo, styles, posicaoNome, posicaoCorpo]);

const namesKeyOf = (nomesLista) => JSON.stringify(filterNamesForSave(nomesLista));

const INITIAL_SNAPSHOT = createSnapshot({
  namesKey: namesKeyOf(EMPTY_NAMES),
  textoCorpo: "",
  styles: DEFAULT_STYLES,
  posicaoNome: DEFAULT_POSITIONS.nome,
  posicaoCorpo: DEFAULT_POSITIONS.corpo,
});

const projectToModelState = (data) => {
  const nomesLista = data.nomes_lista?.length ? data.nomes_lista : EMPTY_NAMES;

  return {
    nomesLista,
    textoCorpo: data.texto_corpo || "",
    styles: {
      corNome: data.cor_nome || DEFAULT_STYLES.corNome,
      fonteNome: data.fonte_nome || DEFAULT_STYLES.fonteNome,
      tamanhoNome: data.tamanho_nome || DEFAULT_STYLES.tamanhoNome,
      corCorpo: data.cor_corpo || DEFAULT_STYLES.corCorpo,
      fonteCorpo: data.fonte_corpo || DEFAULT_STYLES.fonteCorpo,
      tamanhoCorpo: data.tamanho_corpo || DEFAULT_STYLES.tamanhoCorpo,
    },
    posicaoNome: data.posicao_nome || DEFAULT_POSITIONS.nome,
    posicaoCorpo: data.posicao_corpo || DEFAULT_POSITIONS.corpo,
  };
};

export const useEditorModel = () => {
  const [nomesLista, setNomesLista] = useState(EMPTY_NAMES);
  const [bulkText, setBulkText] = useState("");
  const [corNome, setCorNome] = useState(DEFAULT_STYLES.corNome);
  const [posicaoNome, setPosicaoNome] = useState(DEFAULT_POSITIONS.nome);
  const [textoCorpo, setTextoCorpo] = useState("");
  const [corCorpo, setCorCorpo] = useState(DEFAULT_STYLES.corCorpo);
  const [posicaoCorpo, setPosicaoCorpo] = useState(DEFAULT_POSITIONS.corpo);
  const [fonteNome, setFonteNome] = useState(DEFAULT_STYLES.fonteNome);
  const [fonteCorpo, setFonteCorpo] = useState(DEFAULT_STYLES.fonteCorpo);
  const [tamanhoNome, setTamanhoNome] = useState(DEFAULT_STYLES.tamanhoNome);
  const [tamanhoCorpo, setTamanhoCorpo] = useState(DEFAULT_STYLES.tamanhoCorpo);
  const [indexEditando, setIndexEditando] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState(INITIAL_SNAPSHOT);

  // Criado uma única vez: o cache sobrevive entre renders (ex.: arraste no canvas).
  const [getCachedTextBox] = useState(() => createTextBoxMeasurer());

  const nomesValidos = useMemo(
    () => getValidNames(nomesLista),
    [nomesLista]
  );

  const textoCorpoBase = useMemo(() => {
    const texto = textoCorpo?.trim();
    return texto && texto.length > 0 ? texto : "";
  }, [textoCorpo]);

  const styles = useMemo(
    () => ({
      corNome,
      fonteNome,
      tamanhoNome,
      corCorpo,
      fonteCorpo,
      tamanhoCorpo,
    }),
    [corNome, fonteNome, tamanhoNome, corCorpo, fonteCorpo, tamanhoCorpo]
  );

  const positions = useMemo(
    () => ({
      nome: posicaoNome,
      corpo: posicaoCorpo,
    }),
    [posicaoNome, posicaoCorpo]
  );

  const namesKey = useMemo(() => namesKeyOf(nomesLista), [nomesLista]);

  const snapshot = useMemo(
    () =>
      createSnapshot({ namesKey, textoCorpo, styles, posicaoNome, posicaoCorpo }),
    [namesKey, textoCorpo, styles, posicaoNome, posicaoCorpo]
  );

  const isDirty = snapshot !== savedSnapshot;

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
    const state = projectToModelState(data);

    setNomesLista(state.nomesLista);
    setBulkText(namesToBulkText(state.nomesLista));
    setTextoCorpo(state.textoCorpo);
    setCorNome(state.styles.corNome);
    setFonteNome(state.styles.fonteNome);
    setTamanhoNome(state.styles.tamanhoNome);
    setCorCorpo(state.styles.corCorpo);
    setFonteCorpo(state.styles.fonteCorpo);
    setTamanhoCorpo(state.styles.tamanhoCorpo);
    setPosicaoNome(state.posicaoNome);
    setPosicaoCorpo(state.posicaoCorpo);
    setSavedSnapshot(
      createSnapshot({
        namesKey: namesKeyOf(state.nomesLista),
        textoCorpo: state.textoCorpo,
        styles: state.styles,
        posicaoNome: state.posicaoNome,
        posicaoCorpo: state.posicaoCorpo,
      })
    );
  }, []);

  const markSaved = useCallback((savedState) => {
    setSavedSnapshot(savedState);
  }, []);

  const buildProjectPayload = (certificateId) => ({
    nomesLista: filterNamesForSave(nomesLista),
    textoCorpo,
    estilos: styles,
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
    snapshot,
    isDirty,
    markSaved,
  };
};
