import { DEFAULT_NAME_TEXT, MAX_PREVIEW_ITEMS } from "../constants/editor";
import { resolveBodyText } from "../utils/names";
import CertificateCanvas from "./CertificateCanvas";
import { EditIcon, ExitEditIcon } from "./EditorIcons";

const INSTRUCTIONS_ID = "canvas-instructions";
const EMPTY_ITEMS = [{ nome: "", overrides: {} }];

const CertificatePreviewList = ({ certificate, model, interaction }) => {
  const items = (
    model.nomesValidos.length > 0 ? model.nomesValidos : EMPTY_ITEMS
  ).slice(0, MAX_PREVIEW_ITEMS);

  return (
    <>
      <p id={INSTRUCTIONS_ID} className="visually-hidden">
        Pressione Enter para alternar entre o nome e o texto do certificado,
        use as setas para mover o item selecionado (Shift move mais rápido)
        e Esc para desmarcar. Em telas de toque, toque no texto para
        selecioná-lo e depois arraste.
      </p>

      {items.map((item, index) => {
        const textoFinal = resolveBodyText(item, model.textoCorpoBase);
        const isEditing = model.indexEditando === index;
        const displayName = item.nome || DEFAULT_NAME_TEXT;

        return (
          <div
            key={index}
            className={`canvas-wrapper ${isEditing ? "editando-este" : ""}`}
          >
            <button
              type="button"
              className={`btn-editar-individual ${isEditing ? "active" : ""}`}
              onClick={() =>
                model.setIndexEditando(isEditing ? null : index)
              }
              aria-pressed={isEditing}
            >
              {isEditing ? (
                <>
                  <ExitEditIcon />
                  <span>Sair da Edição</span>
                </>
              ) : (
                <>
                  <EditIcon />
                  <span>Texto Individual</span>
                </>
              )}
            </button>

            <CertificateCanvas
              imageUrl={certificate.previewUrl}
              nome={item.nome}
              textoCorpo={textoFinal}
              styles={model.styles}
              posicaoNome={model.posicaoNome}
              posicaoCorpo={model.posicaoCorpo}
              interaction={interaction}
              measure={model.getCachedTextBox}
              label={`Certificado ${index + 1} de ${items.length}: ${displayName}`}
              describedBy={INSTRUCTIONS_ID}
            />

            {item.overrides?.textoCorpo && !isEditing && (
              <span className="badge-custom-text">
                Este certificado possui um texto personalizado.
              </span>
            )}
          </div>
        );
      })}
    </>
  );
};

export default CertificatePreviewList;
