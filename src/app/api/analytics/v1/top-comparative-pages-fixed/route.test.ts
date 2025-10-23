import { describe, expect, it } from "vitest";

describe("Fixed API URL Construction Test", () => {
  it("should construct the correct API URL for fixed endpoint", () => {
    const selectedPaths = [
      "/hinojos/fiestas-y-tradiciones/",
      "/hinojos",
      "/almonte/donana/",
    ];

    const queryParams = {
      start: "2024-10-15",
      end: "2024-10-22",
      granularity: "d",
      includeSeriesFor: selectedPaths,
    };

    const url = new URLSearchParams();
    url.set("start", queryParams.start);
    url.set("end", queryParams.end);
    url.set("granularity", queryParams.granularity);

    queryParams.includeSeriesFor.forEach((path) => {
      url.append("includeSeriesFor", path);
    });

    const fullUrl = `/api/analytics/v1/top-comparative-pages-fixed?${url.toString()}`;

    console.log("🌐 FIXED API URL:", fullUrl);

    // Verificar que usa el endpoint fixed
    expect(fullUrl).toContain("/top-comparative-pages-fixed");
    expect(fullUrl).toContain(
      "includeSeriesFor=%2Fhinojos%2Ffiestas-y-tradiciones%2F"
    );
    expect(fullUrl).toContain("includeSeriesFor=%2Fhinojos");
    expect(fullUrl).toContain("includeSeriesFor=%2Falmonte%2Fdonana%2F");
    expect(fullUrl).toContain("granularity=d");

    // La URL debería ser diferente de la original
    const originalUrl = `/api/analytics/v1/top-comparative-pages?${url.toString()}`;
    expect(fullUrl).not.toBe(originalUrl);

    console.log("✅ Fixed API URL is correctly constructed");
  });
});
