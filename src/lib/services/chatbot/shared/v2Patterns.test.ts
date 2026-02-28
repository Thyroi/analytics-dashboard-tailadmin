import { buildCategoryPattern, getCategoryToken } from "./v2Patterns";
import { describe, expect, it } from "vitest";

describe("v2Patterns category token mapping", () => {
  it("uses canonical category tokens expected by chatbot backend", () => {
    expect(getCategoryToken("naturaleza")).toBe("naturaleza");
    expect(getCategoryToken("fiestasTradiciones")).toBe("tradiciones");
    expect(getCategoryToken("playas")).toBe("playas");
    expect(getCategoryToken("espaciosMuseisticos")).toBe("museos");
    expect(getCategoryToken("patrimonio")).toBe("patrimonio");
    expect(getCategoryToken("rutasCulturales")).toBe("rutas_culturales");
    expect(getCategoryToken("rutasSenderismo")).toBe("senderismo");
    expect(getCategoryToken("sabor")).toBe("gastronomia");
    expect(getCategoryToken("donana")).toBe("donana");
    expect(getCategoryToken("circuitoMonteblanco")).toBe("monteblanco");
    expect(getCategoryToken("laRabida")).toBe("la_rabida");
    expect(getCategoryToken("lugaresColombinos")).toBe("lugares_colombinos");
    expect(getCategoryToken("otros")).toBe("otros");
  });

  it("builds expected category wildcard patterns", () => {
    expect(buildCategoryPattern("naturaleza")).toBe("*.naturaleza");
    expect(buildCategoryPattern("fiestasTradiciones")).toBe("*.tradiciones");
    expect(buildCategoryPattern("espaciosMuseisticos")).toBe("*.museos");
    expect(buildCategoryPattern("rutasSenderismo")).toBe("*.senderismo");
    expect(buildCategoryPattern("circuitoMonteblanco")).toBe("*.monteblanco");
    expect(buildCategoryPattern("sabor")).toBe("*.gastronomia");
    expect(buildCategoryPattern("laRabida")).toBe("*.la_rabida");
    expect(buildCategoryPattern("lugaresColombinos")).toBe(
      "*.lugares_colombinos",
    );
  });

  it("keeps others excluded from wildcard pattern requests", () => {
    expect(buildCategoryPattern("otros")).toBeNull();
  });
});
