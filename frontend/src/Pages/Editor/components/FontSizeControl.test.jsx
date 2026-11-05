import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FontSizeControl from "./FontSizeControl";

const setup = (value = 40) => {
  const onChange = vi.fn();
  render(<FontSizeControl id="size" label="Tamanho" value={value} onChange={onChange} />);
  return { onChange, number: screen.getByLabelText("Tamanho em pixels") };
};

describe("FontSizeControl", () => {
  it("aplica valores válidos enquanto o usuário digita", () => {
    const { onChange, number } = setup();

    fireEvent.change(number, { target: { value: "55" } });

    expect(onChange).toHaveBeenCalledWith(55);
  });

  it("não aplica 0 quando o campo é apagado e restaura o valor ao sair", () => {
    const { onChange, number } = setup(40);

    fireEvent.change(number, { target: { value: "" } });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.blur(number);
    expect(onChange).not.toHaveBeenCalled();
    expect(number).toHaveProperty("value", "40");
  });

  it("ajusta ao limite ao sair do campo e arredonda decimais", () => {
    const { onChange, number } = setup();

    fireEvent.change(number, { target: { value: "500" } });
    fireEvent.blur(number);
    expect(onChange).toHaveBeenLastCalledWith(150);

    fireEvent.change(number, { target: { value: "45.6" } });
    expect(onChange).toHaveBeenLastCalledWith(46);
  });
});
