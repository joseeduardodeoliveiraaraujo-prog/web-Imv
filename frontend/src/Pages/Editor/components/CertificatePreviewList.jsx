import { MAX_PREVIEW_ITEMS } from "../constants/editor";
import { resolveBodyText } from "../utils/names";
import CertificateCanvas from "./CertificateCanvas";

const CertificatePreviewList = ({ certificate, model, interaction }) => {
  const items = (
    model.nomesValidos.length > 0
      ? model.nomesValidos
      : [{ nome: "", overrides: {} }]
  ).slice(0, MAX_PREVIEW_ITEMS);

  return (
    <>
      {items.map((item, index) => {
        const textoFinal = resolveBodyText(item, model.textoCorpoBase);
        const isEditing = model.indexEditando === index;

        return (
          <div
            key={index}
            className={`canvas-wrapper ${isEditing ? "editando-este" : ""}`}
          >
            <button
              className={`btn-editar-individual ${isEditing ? "active" : ""}`}
              onClick={() =>
                model.setIndexEditando(isEditing ? null : index)
              }
            >
              {isEditing ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 14L4 9l5-5" />
                    <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                  </svg>
                  <span>Sair da Edição</span>
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Texto Individual</span>
                </>
              )}
            </button>

            <CertificateCanvas
              certificate={certificate}
              nome={item.nome}
              textoCorpo={textoFinal}
              corNome={model.corNome}
              corCorpo={model.corCorpo}
              fonteNome={model.fonteNome}
              fonteCorpo={model.fonteCorpo}
              tamanhoNome={model.tamanhoNome}
              tamanhoCorpo={model.tamanhoCorpo}
              posicaoNome={model.posicaoNome}
              posicaoCorpo={model.posicaoCorpo}
              isDragging={interaction.isDraggingRef.current}
              itemHover={interaction.itemHover}
              itemArrastado={interaction.itemArrastadoRef.current}
              itemSelecionado={interaction.itemSelecionado}
              onMouseDown={interaction.handleMouseDown}
              onMouseMove={interaction.handleMouseMove}
              onMouseUp={interaction.handleMouseUp}
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
