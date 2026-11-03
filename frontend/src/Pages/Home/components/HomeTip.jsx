import { FaLightbulb } from "react-icons/fa";

const HomeTip = () => (
  <section className="home-tip">
    <div className="home-tip-heading">
      <FaLightbulb aria-hidden="true" />
      <h4>Dica de produtividade</h4>
    </div>
    <p>
      No editor, cole a lista de participantes com{" "}
      <strong>um nome por linha</strong>. Você também pode ajustar o texto do
      corpo individualmente e exportar todos os certificados de uma só vez em
      PDF ou JPEG.
    </p>
  </section>
);

export default HomeTip;
