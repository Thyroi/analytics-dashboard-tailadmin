/**
 * Test para validar la lógica de distribución de datos en current/previous
 * para la ruta /api/analytics/v1/top-comparative-pages-fixed
 *
 * OBJETIVO: Verificar que los datos de GA4 se asignan correctamente a los períodos
 */

import { buildLaggedAxisForGranularity } from "@/lib/utils/time/timeAxis";
import { describe, expect, it } from "vitest";

describe("Delta Calculation - top-comparative-pages-fixed", () => {
  describe("buildLaggedAxisForGranularity - Granularidad 'd' (7 días)", () => {
    it("debe generar rangos current/previous correctos para granularidad diaria", () => {
      // Caso: endISO = "2024-11-23" (domingo)
      const endISO = "2024-11-23";
      const axis = buildLaggedAxisForGranularity("d", { endISO });

      console.log("\n📅 GRANULARIDAD 'd' (7 días)");
      console.log("  endISO:", endISO);
      console.log("  dimensionTime:", axis.dimensionTime);
      console.log("  xLabels:", axis.xLabels);
      console.log("\n📊 CURRENT RANGE:");
      console.log("  start:", axis.curRange.start);
      console.log("  end:", axis.curRange.end);
      console.log("  keys:", axis.curKeys);
      console.log("\n📊 PREVIOUS RANGE:");
      console.log("  start:", axis.prevRange.start);
      console.log("  end:", axis.prevRange.end);
      console.log("  keys:", axis.prevKeys);
      console.log("\n🔍 QUERY RANGE (unión para GA):");
      console.log("  start:", axis.queryRange.start);
      console.log("  end:", axis.queryRange.end);

      // Verificar que dimensionTime es "date"
      expect(axis.dimensionTime).toBe("date");

      // Verificar que hay 7 días en current
      expect(axis.curKeys.length).toBe(7);
      expect(axis.prevKeys.length).toBe(7);

      // Verificar que current termina en endISO
      expect(axis.curRange.end).toBe("2024-11-23");
      // Current empieza 6 días antes de endISO
      expect(axis.curRange.start).toBe("2024-11-17");

      // Verificar que previous es la semana ANTERIOR completa (sin solapamiento)
      expect(axis.prevRange.end).toBe("2024-11-16"); // 1 día antes del inicio de current
      expect(axis.prevRange.start).toBe("2024-11-10"); // 7 días antes del fin de previous

      // Verificar xLabels (deben coincidir con curKeys para granularidad diaria)
      expect(axis.xLabels).toEqual(axis.curKeys);

      // Verificar queryRange (debe cubrir desde prevStart hasta curEnd)
      expect(axis.queryRange.start).toBe("2024-11-10");
      expect(axis.queryRange.end).toBe("2024-11-23");

      // Verificar índices
      expect(axis.curIndexByKey.get("2024-11-17")).toBe(0);
      expect(axis.curIndexByKey.get("2024-11-23")).toBe(6);
      expect(axis.prevIndexByKey.get("2024-11-10")).toBe(0);
      expect(axis.prevIndexByKey.get("2024-11-16")).toBe(6);
    });

    it("debe asignar correctamente datos simulados de GA4 a current/previous", () => {
      const endISO = "2024-11-23";
      const axis = buildLaggedAxisForGranularity("d", { endISO });

      // Simular datos que vendrían de GA4
      // GA4 devuelve dimensionValues[0] en formato YYYYMMDD
      const mockGA4Rows = [
        // Datos del período PREVIOUS (2024-11-10 a 2024-11-16) - SIN solapamiento
        { date: "20241110", views: 100 }, // prev[0]
        { date: "20241111", views: 150 }, // prev[1]
        { date: "20241112", views: 120 }, // prev[2]
        { date: "20241113", views: 180 }, // prev[3]
        { date: "20241114", views: 200 }, // prev[4]
        { date: "20241115", views: 170 }, // prev[5]
        { date: "20241116", views: 190 }, // prev[6]
        // Datos del período CURRENT (2024-11-17 a 2024-11-23) - SIN solapamiento
        { date: "20241117", views: 110 }, // cur[0]
        { date: "20241118", views: 130 }, // cur[1]
        { date: "20241119", views: 140 }, // cur[2]
        { date: "20241120", views: 160 }, // cur[3]
        { date: "20241121", views: 180 }, // cur[4]
        { date: "20241122", views: 200 }, // cur[5]
        { date: "20241123", views: 220 }, // cur[6]
      ];

      // Procesar datos como lo hace fetchUrlSeries
      const N = axis.xLabels.length;
      const currViews: number[] = Array(N).fill(0);
      const prevViews: number[] = Array(N).fill(0);

      for (const row of mockGA4Rows) {
        const slotRaw = row.date;
        const vws = row.views;

        // Convertir YYYYMMDD -> YYYY-MM-DD
        let slotKey: string | null = null;
        if (slotRaw.length === 8) {
          slotKey = `${slotRaw.slice(0, 4)}-${slotRaw.slice(
            4,
            6
          )}-${slotRaw.slice(6, 8)}`;
        }
        if (!slotKey) continue;

        const iCur = axis.curIndexByKey.get(slotKey);
        const iPrev = axis.prevIndexByKey.get(slotKey);

        if (iCur !== undefined) {
          currViews[iCur] += vws;
        }
        if (iPrev !== undefined) {
          prevViews[iPrev] += vws;
        }
      }

      console.log("\n🧪 DATOS PROCESADOS:");
      console.log("  Current Views:", currViews);
      console.log("  Previous Views:", prevViews);

      // Verificar distribución correcta - AHORA SIN SOLAPAMIENTO
      // 2024-11-17 SOLO aparece en current (índice 0)
      expect(currViews[0]).toBe(110); // 2024-11-17 en current

      // 2024-11-16 SOLO aparece en previous (índice 6)
      expect(prevViews[6]).toBe(190); // 2024-11-16 en previous

      // 2024-11-23 solo aparece en current (último día)
      expect(currViews[6]).toBe(220); // 2024-11-23 en current

      // 2024-11-10 solo aparece en previous (primer día)
      expect(prevViews[0]).toBe(100); // 2024-11-10 en previous

      // Suma total para verificación
      const totalCurrent = currViews.reduce((a, b) => a + b, 0);
      const totalPrevious = prevViews.reduce((a, b) => a + b, 0);

      console.log("  Total Current:", totalCurrent);
      console.log("  Total Previous:", totalPrevious);

      expect(totalCurrent).toBe(1140); // 110+130+140+160+180+200+220
      expect(totalPrevious).toBe(1110); // 100+150+120+180+200+170+190
    });
  });

  describe("buildLaggedAxisForGranularity - Granularidad 'm' (30 días)", () => {
    it("debe generar rangos current/previous correctos para granularidad mensual", () => {
      const endISO = "2024-11-23";
      const axis = buildLaggedAxisForGranularity("m", { endISO });

      console.log("\n📅 GRANULARIDAD 'm' (30 días)");
      console.log("  endISO:", endISO);
      console.log("  dimensionTime:", axis.dimensionTime);
      console.log("\n📊 CURRENT RANGE:");
      console.log("  start:", axis.curRange.start);
      console.log("  end:", axis.curRange.end);
      console.log("  días:", axis.curKeys.length);
      console.log("\n📊 PREVIOUS RANGE:");
      console.log("  start:", axis.prevRange.start);
      console.log("  end:", axis.prevRange.end);
      console.log("  días:", axis.prevKeys.length);

      // Verificar que dimensionTime es "date"
      expect(axis.dimensionTime).toBe("date");

      // Verificar que hay 30 días en current y previous
      expect(axis.curKeys.length).toBe(30);
      expect(axis.prevKeys.length).toBe(30);

      // Verificar que current termina en endISO
      expect(axis.curRange.end).toBe("2024-11-23");
      // Current empieza 29 días antes
      expect(axis.curRange.start).toBe("2024-10-25");

      // Verificar que previous es la ventana anterior completa (sin solapamiento)
      expect(axis.prevRange.end).toBe("2024-10-24"); // 1 día antes del inicio de current
      expect(axis.prevRange.start).toBe("2024-09-25"); // 30 días antes
    });
  });

  describe("buildLaggedAxisForGranularity - Granularidad 'y' (12 meses)", () => {
    it("debe generar rangos current/previous correctos para granularidad anual", () => {
      const endISO = "2024-11-23";
      const axis = buildLaggedAxisForGranularity("y", { endISO });

      console.log("\n📅 GRANULARIDAD 'y' (12 meses)");
      console.log("  endISO:", endISO);
      console.log("  dimensionTime:", axis.dimensionTime);
      console.log("\n📊 CURRENT RANGE:");
      console.log("  start:", axis.curRange.start);
      console.log("  end:", axis.curRange.end);
      console.log("  keys (YYYYMM):", axis.curKeys);
      console.log("\n📊 PREVIOUS RANGE:");
      console.log("  start:", axis.prevRange.start);
      console.log("  end:", axis.prevRange.end);
      console.log("  keys (YYYYMM):", axis.prevKeys);

      // Verificar que dimensionTime es "yearMonth"
      expect(axis.dimensionTime).toBe("yearMonth");

      // Verificar que hay 12 meses
      expect(axis.curKeys.length).toBe(12);
      expect(axis.prevKeys.length).toBe(12);

      // Verificar que xLabels son en formato YYYY-MM
      expect(axis.xLabels[0]).toMatch(/^\d{4}-\d{2}$/);

      // Verificar desplazamiento de 1 mes entre current y previous
      // Si current termina en nov-2024, previous termina en oct-2024
      const lastCurMonth = axis.curKeys[11]; // último mes current
      const lastPrevMonth = axis.prevKeys[11]; // último mes previous

      console.log("  Último mes current:", lastCurMonth);
      console.log("  Último mes previous:", lastPrevMonth);

      // Convertir YYYYMM a número para comparar
      const curMonthNum = parseInt(lastCurMonth);
      const prevMonthNum = parseInt(lastPrevMonth);

      // Previous debe ser 12 meses (100 o 1200-88=1112 si cambia año) antes que current
      const diff = curMonthNum - prevMonthNum;
      // Para nov-2024 (202411) - nov-2023 (202311) = 100
      expect([100, 1200 - 88]).toContain(diff);
    });

    it("debe asignar correctamente datos mensuales a current/previous", () => {
      const endISO = "2024-11-23";
      const axis = buildLaggedAxisForGranularity("y", { endISO });

      console.log("\n🧪 DATOS MENSUALES - Verificación de sin solapamiento:");
      console.log("  Current keys:", axis.curKeys);
      console.log("  Previous keys:", axis.prevKeys);

      // Verificar que NO hay solapamiento entre current y previous
      const solapadas: string[] = [];
      for (const curKey of axis.curKeys) {
        if (axis.prevIndexByKey.has(curKey)) {
          solapadas.push(curKey);
        }
      }

      console.log(
        "  Meses solapados:",
        solapadas.length > 0 ? solapadas : "NINGUNO ✅"
      );
      expect(solapadas.length).toBe(0);

      // Verificar que los rangos son correctos
      expect(axis.curKeys.length).toBe(12);
      expect(axis.prevKeys.length).toBe(12);
    });
  });

  describe("PROBLEMAS POTENCIALES - Diagnóstico", () => {
    it("CASO: Fechas solapadas entre current y previous", () => {
      const endISO = "2024-11-23";
      const axis = buildLaggedAxisForGranularity("d", { endISO });

      console.log("\n⚠️  DIAGNÓSTICO: Solapamiento de fechas");
      console.log("════════════════════════════════════════");

      // Verificar qué fechas aparecen en ambos períodos
      const solapadas: string[] = [];
      for (const curKey of axis.curKeys) {
        if (axis.prevIndexByKey.has(curKey)) {
          solapadas.push(curKey);
        }
      }

      console.log("📍 Fechas que aparecen en AMBOS períodos:");
      console.log(
        "  ",
        solapadas.length > 0 ? solapadas.join(", ") : "NINGUNA ✅"
      );
      console.log(
        `   Total: ${solapadas.length} de ${axis.curKeys.length} días`
      );

      if (solapadas.length === 0) {
        console.log("\n✅ CORRECCIÓN EXITOSA:");
        console.log("  NO hay fechas solapadas");
        console.log(
          "  Current y Previous son ventanas completamente separadas"
        );
      }

      // Después de la corrección, NO debe haber solapamiento
      expect(solapadas.length).toBe(0);
    });

    it("CASO: Validar que queryRange cubre ambos períodos", () => {
      const endISO = "2024-11-23";
      const axis = buildLaggedAxisForGranularity("d", { endISO });

      console.log("\n🔍 DIAGNÓSTICO: Cobertura de queryRange");
      console.log("════════════════════════════════════════");

      console.log("  queryRange:", axis.queryRange);
      console.log("  curRange:", axis.curRange);
      console.log("  prevRange:", axis.prevRange);

      // Verificar que queryRange.start <= prevRange.start
      expect(axis.queryRange.start <= axis.prevRange.start).toBe(true);
      // Verificar que queryRange.end >= curRange.end
      expect(axis.queryRange.end >= axis.curRange.end).toBe(true);

      console.log(
        "  ✅ queryRange cubre correctamente ambos períodos en UN SOLO query"
      );
    });

    it("CASO: Verificar alineación de índices", () => {
      const endISO = "2024-11-23";
      const axis = buildLaggedAxisForGranularity("d", { endISO });

      console.log("\n🔍 DIAGNÓSTICO: Alineación de índices");
      console.log("════════════════════════════════════════");

      // Verificar que current[i] y previous[i] corresponden a fechas en ventanas separadas
      for (let i = 0; i < axis.xLabels.length; i++) {
        const curDate = axis.curKeys[i];
        const prevDate = axis.prevKeys[i];

        console.log(`  Índice ${i}: current=${curDate}, previous=${prevDate}`);

        // Convertir a Date para comparar
        const curD = new Date(curDate);
        const prevD = new Date(prevDate);

        // Previous debe ser exactamente N días antes que current (mismo índice)
        // Para granularidad 'd' (7 días), previous[i] = current[i] - 7 días
        const diffDays = Math.round(
          (curD.getTime() - prevD.getTime()) / (1000 * 60 * 60 * 24)
        );

        expect(diffDays).toBe(7); // Ventanas de 7 días sin solapamiento
      }

      console.log(
        "  ✅ Los índices están alineados: current[i] = previous[i] + 7 días"
      );
    });
  });
});
