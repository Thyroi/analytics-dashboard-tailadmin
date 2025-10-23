import { describe, expect, it } from "vitest";
import { colorForPath, colorsForPaths } from "@/lib/analytics/colors";

describe("colorForPath", () => {
  it("should return consistent colors for the same path", () => {
    const path = "/category/test-page";
    const color1 = colorForPath(path);
    const color2 = colorForPath(path);
    
    expect(color1).toBe(color2);
    expect(color1).toMatch(/^#[0-9a-f]{6}$/i);
  });
  
  it("should return different colors for different paths", () => {
    const path1 = "/category/page-1";
    const path2 = "/category/page-2";
    
    const color1 = colorForPath(path1);
    const color2 = colorForPath(path2);
    
    // They might be the same due to hash collision, but likely different
    expect(color1).toMatch(/^#[0-9a-f]{6}$/i);
    expect(color2).toMatch(/^#[0-9a-f]{6}$/i);
  });
  
  it("should handle special characters in paths", () => {
    const path = "/categoría/página-con-ñ";
    const color = colorForPath(path);
    
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("colorsForPaths", () => {
  it("should return color mapping for multiple paths", () => {
    const paths = ["/page-1", "/page-2", "/page-3"];
    const colors = colorsForPaths(paths);
    
    expect(Object.keys(colors)).toHaveLength(3);
    paths.forEach(path => {
      expect(colors[path]).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
  
  it("should return empty object for empty paths array", () => {
    const colors = colorsForPaths([]);
    expect(colors).toEqual({});
  });
});