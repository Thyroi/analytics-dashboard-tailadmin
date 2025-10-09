/**
 * Utilidades para manejo de fechas y períodos en TZ America/Bogota
 * Según especificaciones del prompt maestro
 */

import type { ComparisonMode, Granularity, PeriodConfig } from "../types";

export const TIMEZONE = "America/Bogota";

/**
 * Convierte una fecha a la zona horaria de Bogotá
 */
export function toBogotaDate(date: Date): Date {
  const bogotaTime = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  return new Date(`${bogotaTime}T00:00:00.000Z`);
}

/**
 * Obtiene "hoy" en zona horaria de Bogotá
 */
export function todayBogota(): Date {
  return toBogotaDate(new Date());
}

/**
 * Obtiene "ayer" en zona horaria de Bogotá
 */
export function yesterdayBogota(): Date {
  const today = todayBogota();
  return new Date(today.getTime() - 24 * 60 * 60 * 1000);
}

/**
 * Formatea fecha según granularidad para la API
 */
export function formatDateForAPI(date: Date, granularity: Granularity): string {
  const bogotaDate = toBogotaDate(date);
  const year = bogotaDate.getUTCFullYear();
  const month = bogotaDate.getUTCMonth() + 1;
  const day = bogotaDate.getUTCDate();

  switch (granularity) {
    case "d":
      return `${year}${month.toString().padStart(2, "0")}${day
        .toString()
        .padStart(2, "0")}`;
    case "w": {
      // ISO week format
      const weekData = getISOWeek(bogotaDate);
      return `${weekData.year}/${weekData.week.toString().padStart(2, "0")}`;
    }
    case "m":
      return `${year}/${month.toString().padStart(2, "0")}`;
    case "y":
      return year.toString(); // Formato simple YYYY como requiere la API
    default:
      throw new Error(`Granularidad no soportada: ${granularity}`);
  }
}

/**
 * Obtiene el número de semana ISO para una fecha
 */
function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { year: d.getUTCFullYear(), week: weekNo };
}

/**
 * Calcula los períodos actual y anterior según especificaciones
 */
export function computePeriods(
  granularity: Granularity,
  _comparisonMode: ComparisonMode = "toDate"
): PeriodConfig {
  const yesterday = yesterdayBogota();

  switch (granularity) {
    case "d": {
      // Día: ayer vs anteayer
      const dayBefore = new Date(yesterday.getTime() - 24 * 60 * 60 * 1000);

      return {
        granularity,
        currentStart: formatDateForAPI(yesterday, "d"),
        currentEnd: formatDateForAPI(yesterday, "d"),
        previousStart: formatDateForAPI(dayBefore, "d"),
        previousEnd: formatDateForAPI(dayBefore, "d"),
        apiGranularity: "d",
        apiStartTime: formatDateForAPI(dayBefore, "d"),
        apiEndTime: formatDateForAPI(yesterday, "d"),
      };
    }

    case "w": {
      // Semana: actual to-date vs anterior to-date
      const currentWeekStart = getWeekStart(yesterday);
      const prevWeekStart = new Date(
        currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000
      );
      const prevWeekEquivalent = new Date(
        prevWeekStart.getTime() +
          (yesterday.getTime() - currentWeekStart.getTime())
      );

      return {
        granularity,
        currentStart: formatDateForAPI(currentWeekStart, "d"),
        currentEnd: formatDateForAPI(yesterday, "d"),
        previousStart: formatDateForAPI(prevWeekStart, "d"),
        previousEnd: formatDateForAPI(prevWeekEquivalent, "d"),
        apiGranularity: "d",
        apiStartTime: formatDateForAPI(prevWeekStart, "d"),
        apiEndTime: formatDateForAPI(yesterday, "d"),
      };
    }

    case "m": {
      // Mes: actual to-date vs anterior to-date
      const currentMonthStart = getMonthStart(yesterday);
      const prevMonthStart = getPrevMonthStart(currentMonthStart);
      const daysIntoMonth = Math.floor(
        (yesterday.getTime() - currentMonthStart.getTime()) /
          (24 * 60 * 60 * 1000)
      );
      const prevMonthEquivalent = new Date(
        prevMonthStart.getTime() + daysIntoMonth * 24 * 60 * 60 * 1000
      );

      return {
        granularity,
        currentStart: formatDateForAPI(currentMonthStart, "d"),
        currentEnd: formatDateForAPI(yesterday, "d"),
        previousStart: formatDateForAPI(prevMonthStart, "d"),
        previousEnd: formatDateForAPI(prevMonthEquivalent, "d"),
        apiGranularity: "d",
        apiStartTime: formatDateForAPI(prevMonthStart, "d"),
        apiEndTime: formatDateForAPI(yesterday, "d"),
      };
    }

    case "y": {
      // Año: actual to-date vs anterior to-date
      const currentYearStart = getYearStart(yesterday);
      const prevYearStart = getPrevYearStart(currentYearStart);
      const daysIntoYear = Math.floor(
        (yesterday.getTime() - currentYearStart.getTime()) /
          (24 * 60 * 60 * 1000)
      );
      const prevYearEquivalent = new Date(
        prevYearStart.getTime() + daysIntoYear * 24 * 60 * 60 * 1000
      );

      return {
        granularity,
        currentStart: formatDateForAPI(currentYearStart, "d"),
        currentEnd: formatDateForAPI(yesterday, "d"),
        previousStart: formatDateForAPI(prevYearStart, "d"),
        previousEnd: formatDateForAPI(prevYearEquivalent, "d"),
        apiGranularity: "d",
        apiStartTime: formatDateForAPI(prevYearStart, "d"),
        apiEndTime: formatDateForAPI(yesterday, "d"),
      };
    }

    default:
      throw new Error(`Granularidad no soportada: ${granularity}`);
  }
}

/**
 * Obtiene el inicio de la semana (lunes) para una fecha
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Lunes como primer día
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
}

/**
 * Obtiene el inicio del mes para una fecha
 */
function getMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/**
 * Obtiene el inicio del mes anterior
 */
function getPrevMonthStart(monthStart: Date): Date {
  const prevMonth = monthStart.getUTCMonth() - 1;
  const year =
    prevMonth < 0
      ? monthStart.getUTCFullYear() - 1
      : monthStart.getUTCFullYear();
  const month = prevMonth < 0 ? 11 : prevMonth;
  return new Date(Date.UTC(year, month, 1));
}

/**
 * Obtiene el inicio del año para una fecha
 */
function getYearStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

/**
 * Obtiene el inicio del año anterior
 */
function getPrevYearStart(yearStart: Date): Date {
  return new Date(Date.UTC(yearStart.getUTCFullYear() - 1, 0, 1));
}

/**
 * Valida formato de fecha según granularidad
 */
export function validateDateFormat(
  dateStr: string,
  granularity: Granularity
): boolean {
  switch (granularity) {
    case "d":
      return /^\d{8}$/.test(dateStr); // yyyymmdd
    case "w":
      return /^\d{4}\/\d{2}$/.test(dateStr); // yyyy/ww
    case "m":
      return /^\d{4}\/\d{2}$/.test(dateStr); // yyyy/mm
    case "y":
      return /^\d{4}$/.test(dateStr); // yyyy
    default:
      return false;
  }
}
