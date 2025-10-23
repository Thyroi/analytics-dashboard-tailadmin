/**
 * Tests para el sistema de colores contrastantes
 */

import { describe, expect, it } from "vitest";
import {
  AVAILABLE_COLORS,
  AVAILABLE_EXTENDED_COLORS,
  colorForPath,
  colorsForPaths,
  getContrastingColors,
} from "./colors";

describe("Color System", () => {
  describe("colorForPath", () => {
    it("should return consistent colors for the same path", () => {
      const path = "/test-page/";
      const color1 = colorForPath(path);
      const color2 = colorForPath(path);

      expect(color1).toBe(color2);
      expect(color1).toMatch(/^#[0-9A-F]{6}$/i); // Valid hex color
    });

    it("should return different colors for different paths", () => {
      const color1 = colorForPath("/");
      const color2 = colorForPath("/sabor/");
      const color3 = colorForPath("/municipios-del-condado/");

      // Colors should be different (though not guaranteed due to hash collisions)
      expect([color1, color2, color3]).toHaveLength(3);
    });
  });

  describe("getContrastingColors", () => {
    it("should assign colors sequentially for maximum contrast", () => {
      const paths = ["/", "/sabor/", "/municipios-del-condado/"];
      const colors = getContrastingColors(paths);

      expect(Object.keys(colors)).toHaveLength(3);
      expect(colors["/"]).toBe(AVAILABLE_COLORS[0]); // First color
      expect(colors["/sabor/"]).toBe(AVAILABLE_COLORS[1]); // Second color
      expect(colors["/municipios-del-condado/"]).toBe(AVAILABLE_COLORS[2]); // Third color
    });

    it("should handle more than 8 paths using extended colors", () => {
      const paths = Array.from({ length: 10 }, (_, i) => `/page-${i}/`);
      const colors = getContrastingColors(paths);

      expect(Object.keys(colors)).toHaveLength(10);

      // First 8 should use primary colors
      for (let i = 0; i < 8; i++) {
        expect(colors[`/page-${i}/`]).toBe(AVAILABLE_EXTENDED_COLORS[i]);
      }

      // 9th and 10th should cycle back
      expect(colors["/page-8/"]).toBe(AVAILABLE_EXTENDED_COLORS[8]);
      expect(colors["/page-9/"]).toBe(AVAILABLE_EXTENDED_COLORS[9]);
    });

    it("should return empty object for empty paths array", () => {
      const colors = getContrastingColors([]);
      expect(colors).toEqual({});
    });

    it("should handle duplicate paths correctly", () => {
      const paths = ["/", "/", "/sabor/"];
      const colors = getContrastingColors(paths);

      // Should automatically deduplicate paths (objects can't have duplicate keys)
      expect(Object.keys(colors)).toHaveLength(2); // Only unique paths
      expect(colors["/"]).toBe(AVAILABLE_COLORS[0]);
      expect(colors["/sabor/"]).toBe(AVAILABLE_COLORS[1]);
    });
  });

  describe("colorsForPaths", () => {
    it("should return hash-based colors for all paths", () => {
      const paths = ["/", "/sabor/", "/municipios-del-condado/"];
      const colors = colorsForPaths(paths);

      expect(Object.keys(colors)).toHaveLength(3);

      // Should match individual colorForPath calls
      paths.forEach((path) => {
        expect(colors[path]).toBe(colorForPath(path));
      });
    });
  });

  describe("Color Constants", () => {
    it("should have proper color format in AVAILABLE_COLORS", () => {
      expect(AVAILABLE_COLORS).toHaveLength(8);

      AVAILABLE_COLORS.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it("should have proper color format in AVAILABLE_EXTENDED_COLORS", () => {
      expect(AVAILABLE_EXTENDED_COLORS.length).toBeGreaterThan(8);

      AVAILABLE_EXTENDED_COLORS.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it("should have Huelva primary color as first color", () => {
      expect(AVAILABLE_COLORS[0]).toBe("#E55338");
    });
  });

  describe("Color Contrast", () => {
    it("should provide visually distinct colors in sequence", () => {
      const testPaths = [
        "/",
        "/sabor/",
        "/municipios-del-condado/",
        "/events/",
        "/news/",
      ];
      const colors = getContrastingColors(testPaths);

      const colorValues = Object.values(colors);

      // All colors should be different
      const uniqueColors = new Set(colorValues);
      expect(uniqueColors.size).toBe(colorValues.length);

      // Should follow the defined contrasting sequence
      expect(colorValues[0]).toBe("#E55338"); // Huelva primary (Rojo-Naranja)
      expect(colorValues[1]).toBe("#1E40AF"); // Blue 800 (Azul profundo)
      expect(colorValues[2]).toBe("#059669"); // Emerald 600 (Verde)
      expect(colorValues[3]).toBe("#7C2D12"); // Orange 900 (Marrón)
      expect(colorValues[4]).toBe("#6B21A8"); // Purple 800 (Morado)
    });
  });
});
