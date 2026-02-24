import { describe, expect, it } from "vitest";
import { formatUrlForDisplay } from "./url-formatting";

describe("formatUrlForDisplay", () => {
  it("elimina protocolo y dominio en URL absoluta", () => {
    const result = formatUrlForDisplay(
      "https://turismocondado.com/palos/fiestas-y-tradiciones",
    );

    expect(result).toBe("Palos - Fiestas Y Tradiciones");
  });

  it("elimina dominio sin protocolo", () => {
    const result = formatUrlForDisplay(
      "turismocondado.com/palos/fiestas-y-tradiciones",
    );

    expect(result).toBe("Palos - Fiestas Y Tradiciones");
  });

  it("mantiene ruta relativa limpia", () => {
    const result = formatUrlForDisplay("/almonte/naturaleza/ruta-ciclista");

    expect(result).toBe("Almonte - Naturaleza - Ruta Ciclista");
  });

  it("devuelve Inicio para raíz", () => {
    const result = formatUrlForDisplay("https://turismocondado.com/");

    expect(result).toBe("Inicio");
  });
});
