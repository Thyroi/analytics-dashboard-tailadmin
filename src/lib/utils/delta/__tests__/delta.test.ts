/**
 * Tests unitarios para sistema de deltas
 */

import { describe, expect, it } from "vitest";
import {
  clampPctForVisual,
  computeDeltaArtifact,
  getDeltaColor,
  getDeltaIcon,
  getDeltaMainText,
  getDeltaTooltip,
} from "../delta";

describe("computeDeltaArtifact", () => {
  it("debe calcular delta normal (curr=120, prev=100)", () => {
    const result = computeDeltaArtifact(120, 100);

    expect(result.state).toBe("ok");
    expect(result.deltaAbs).toBe(20);
    expect(result.deltaPct).toBeCloseTo(20, 1);
    expect(result.baseInfo).toEqual({ current: 120, prev: 100 });
    expect(result.flags.smallBase).toBe(false);
  });

  it("debe calcular delta negativo (curr=0, prev=80)", () => {
    const result = computeDeltaArtifact(0, 80);

    expect(result.state).toBe("ok");
    expect(result.deltaAbs).toBe(-80);
    expect(result.deltaPct).toBeCloseTo(-100, 1);
  });

  it("debe detectar base pequeña (curr=42, prev=2, threshold=10)", () => {
    const result = computeDeltaArtifact(42, 2, { smallBaseThreshold: 10 });

    expect(result.state).toBe("ok");
    expect(result.deltaAbs).toBe(40);
    expect(result.deltaPct).toBeCloseTo(2000, 1);
    expect(result.flags.smallBase).toBe(true);
  });

  it("debe manejar nuevo vs cero (curr=42, prev=0)", () => {
    const result = computeDeltaArtifact(42, 0);

    expect(result.state).toBe("new_vs_zero");
    expect(result.deltaAbs).toBe(42);
    // NUEVA LÓGICA: deltaPct se calcula usando base=1
    expect(result.deltaPct).toBe(4100); // ((42 - 1) / 1) * 100 = 4100%
  });

  it("debe manejar cero vs cero (curr=0, prev=0)", () => {
    const result = computeDeltaArtifact(0, 0);

    expect(result.state).toBe("zero_vs_zero");
    expect(result.deltaAbs).toBe(0);
    expect(result.deltaPct).toBeNull();
  });

  it("debe detectar base negativa (curr=30, prev=-10)", () => {
    const result = computeDeltaArtifact(30, -10);

    expect(result.state).toBe("neg_or_invalid_base");
    expect(result.deltaAbs).toBe(40);
    expect(result.deltaPct).toBeNull();
  });

  it("debe detectar current faltante (curr=null, prev=40)", () => {
    const result = computeDeltaArtifact(null, 40);

    expect(result.state).toBe("no_current");
    expect(result.deltaAbs).toBeNull();
    expect(result.deltaPct).toBeNull();
    expect(result.baseInfo.current).toBeNull();
    expect(result.baseInfo.prev).toBe(40);
  });

  it("debe detectar prev faltante (curr=40, prev=null)", () => {
    const result = computeDeltaArtifact(40, null);

    expect(result.state).toBe("no_prev");
    expect(result.deltaAbs).toBeNull();
    expect(result.deltaPct).toBeNull();
    expect(result.baseInfo.current).toBe(40);
    expect(result.baseInfo.prev).toBeNull();
  });

  it("debe detectar base muy pequeña (curr=5, prev=0.2, threshold=10)", () => {
    const result = computeDeltaArtifact(5, 0.2, { smallBaseThreshold: 10 });

    expect(result.state).toBe("ok");
    expect(result.deltaPct).toBeCloseTo(2400, 1);
    expect(result.flags.smallBase).toBe(true);
  });

  it("debe manejar valores no finitos - NaN", () => {
    const result = computeDeltaArtifact(NaN, 100);

    expect(result.state).toBe("no_current");
    expect(result.baseInfo.current).toBeNull();
  });

  it("debe manejar valores no finitos - Infinity", () => {
    const result = computeDeltaArtifact(100, Infinity);

    expect(result.state).toBe("no_prev");
    expect(result.baseInfo.prev).toBeNull();
  });

  it("debe aplicar flags opcionales", () => {
    const result = computeDeltaArtifact(100, 50, {
      partialPeriod: true,
      methodChanged: true,
    });

    expect(result.flags.partialPeriod).toBe(true);
    expect(result.flags.methodChanged).toBe(true);
  });
});

describe("getDeltaMainText", () => {
  it("debe formatear delta positivo con %", () => {
    const artifact = computeDeltaArtifact(120, 100);
    const text = getDeltaMainText(artifact);

    expect(text).toBe("+20,0%");
  });

  it("debe formatear delta negativo con %", () => {
    const artifact = computeDeltaArtifact(80, 100);
    const text = getDeltaMainText(artifact);

    expect(text).toBe("−20,0%");
  });

  it("debe formatear cero con %", () => {
    const artifact = computeDeltaArtifact(100, 100);
    const text = getDeltaMainText(artifact);

    expect(text).toBe("0,0%");
  });

  it("debe mostrar +% para nuevo vs cero", () => {
    const artifact = computeDeltaArtifact(42, 0);
    const text = getDeltaMainText(artifact);

    // NUEVA LÓGICA: muestra porcentaje calculado con base=1
    expect(text).toBe("+4100,0%"); // ((42 - 1) / 1) * 100 = 4100%
  });

  it("debe mostrar 'Sin actividad' para cero vs cero", () => {
    const artifact = computeDeltaArtifact(0, 0);
    const text = getDeltaMainText(artifact);

    expect(text).toBe("Sin actividad");
  });

  it("debe mostrar ±Δ para base negativa", () => {
    const artifact = computeDeltaArtifact(30, -10);
    const text = getDeltaMainText(artifact);

    expect(text).toBe("±Δ40");
  });

  it("debe mostrar 'Sin dato actual' para no_current", () => {
    const artifact = computeDeltaArtifact(null, 100);
    const text = getDeltaMainText(artifact);

    expect(text).toBe("Sin dato actual");
  });

  it("debe mostrar 'Sin dato actual' para no_current sin prev", () => {
    const artifact = computeDeltaArtifact(undefined, undefined);
    const text = getDeltaMainText(artifact);

    expect(text).toBe("Sin dato actual");
  });
});

describe("getDeltaColor", () => {
  it("debe retornar verde para delta positivo", () => {
    const artifact = computeDeltaArtifact(120, 100);
    const color = getDeltaColor(artifact);

    expect(color).toBe("text-green-600");
  });

  it("debe retornar rojo para delta negativo", () => {
    const artifact = computeDeltaArtifact(80, 100);
    const color = getDeltaColor(artifact);

    expect(color).toBe("text-red-600");
  });

  it("debe retornar gris para cero", () => {
    const artifact = computeDeltaArtifact(100, 100);
    const color = getDeltaColor(artifact);

    expect(color).toBe("text-gray-500");
  });

  it("debe retornar verde para new_vs_zero", () => {
    const artifact = computeDeltaArtifact(42, 0);
    const color = getDeltaColor(artifact);

    expect(color).toBe("text-green-600");
  });

  it("debe retornar gris cuando no hay datos", () => {
    const artifact = computeDeltaArtifact(null, null);
    const color = getDeltaColor(artifact);

    expect(color).toBe("text-gray-500");
  });
});

describe("getDeltaIcon", () => {
  it("debe retornar ↗ para delta positivo", () => {
    const artifact = computeDeltaArtifact(120, 100);
    const icon = getDeltaIcon(artifact);

    expect(icon).toBe("↗");
  });

  it("debe retornar ↘ para delta negativo", () => {
    const artifact = computeDeltaArtifact(80, 100);
    const icon = getDeltaIcon(artifact);

    expect(icon).toBe("↘");
  });

  it("debe retornar → para cero", () => {
    const artifact = computeDeltaArtifact(100, 100);
    const icon = getDeltaIcon(artifact);

    expect(icon).toBe("→");
  });

  it("debe retornar → cuando no hay datos", () => {
    const artifact = computeDeltaArtifact(null, null);
    const icon = getDeltaIcon(artifact);

    expect(icon).toBe("→");
  });
});

describe("getDeltaTooltip", () => {
  it("debe generar tooltip para caso ok", () => {
    const artifact = computeDeltaArtifact(120, 100);
    const tooltip = getDeltaTooltip(artifact);

    expect(tooltip.title).toBe("Cambio porcentual");
    expect(tooltip.detail).toContain("+20.0%");
    expect(tooltip.detail).toContain("Δ +20");
    expect(tooltip.detail).toContain("de 100 → 120");
    expect(tooltip.chips).toEqual([]);
  });

  it("debe generar tooltip para new_vs_zero", () => {
    const artifact = computeDeltaArtifact(42, 0);
    const tooltip = getDeltaTooltip(artifact);

    expect(tooltip.title).toBe("Nuevo vs base cero");
    // NORMALIZADO: tooltip no menciona base=1, solo muestra valor absoluto
    expect(tooltip.detail).toContain("Sin base previa");
    expect(tooltip.detail).toContain("Δ +42");
    expect(tooltip.detail).toContain("de 0 → 42");
  });

  it("debe incluir chips cuando hay flags", () => {
    const artifact = computeDeltaArtifact(42, 2, {
      smallBaseThreshold: 10,
      partialPeriod: true,
      methodChanged: true,
    });
    const tooltip = getDeltaTooltip(artifact);

    expect(tooltip.chips).toContain("Base pequeña");
    expect(tooltip.chips).toContain("Período parcial");
    expect(tooltip.chips).toContain("Metodología cambiada");
  });

  it("debe generar tooltip para base inválida", () => {
    const artifact = computeDeltaArtifact(30, -10);
    const tooltip = getDeltaTooltip(artifact);

    expect(tooltip.title).toBe("Base inválida");
    expect(tooltip.detail).toContain("Base ≤ 0");
    expect(tooltip.detail).toContain("% no calculable");
  });
});

describe("clampPctForVisual", () => {
  it("debe clampear porcentaje alto positivo", () => {
    expect(clampPctForVisual(2000)).toBe(300);
  });

  it("debe clampear porcentaje alto negativo", () => {
    expect(clampPctForVisual(-500)).toBe(-300);
  });

  it("debe mantener porcentaje dentro del rango", () => {
    expect(clampPctForVisual(50)).toBe(50);
    expect(clampPctForVisual(-50)).toBe(-50);
  });

  it("debe permitir cap personalizado", () => {
    expect(clampPctForVisual(1000, 500)).toBe(500);
    expect(clampPctForVisual(-1000, 500)).toBe(-500);
  });
});
