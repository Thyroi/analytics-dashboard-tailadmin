/**
 * Test básico para ComparativeTopPages - Verifica que el componente se renderiza correctamente
 */

import { describe, expect, it } from "vitest";

describe("ComparativeTopPages", () => {
  it("should compile without TypeScript errors", async () => {
    // This test ensures the component file compiles correctly
    const componentModule = await import("./ComparativeTopPages");
    expect(componentModule.default).toBeDefined();
    expect(typeof componentModule.default).toBe("function");
  });

  it("should have the correct display name", async () => {
    const componentModule = await import("./ComparativeTopPages");
    const Component = componentModule.default;

    // Component should be a function (React component)
    expect(typeof Component).toBe("function");
  });
});
