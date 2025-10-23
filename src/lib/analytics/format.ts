/**
 * Utilidades de formato específicas para ComparativeTopPages
 */

// Formatters using Spanish locale
const numberFormatter = new Intl.NumberFormat("es-ES");
const percentFormatter = new Intl.NumberFormat("es-ES", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

/**
 * Formatea números grandes con locale español
 */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/**
 * Formatea porcentajes de delta con signo y color semántico
 * CRITICAL: Error barriers to prevent callstack errors that could block GA access
 */
export function formatPercent(deltaPct: number | null): {
  text: string;
  variant: "positive" | "negative" | "neutral";
} {
  try {
    // Input validation - handle all edge cases
    if (deltaPct === null || deltaPct === undefined) {
      return {
        text: "—",
        variant: "neutral",
      };
    }

    // Validate numeric input
    const numValue = Number(deltaPct);
    if (!Number.isFinite(numValue)) {
      console.warn("[formatPercent] Invalid numeric value:", deltaPct);
      return {
        text: "—",
        variant: "neutral",
      };
    }

    // Determine variant safely
    let variant: "positive" | "negative" | "neutral";
    if (numValue > 0) {
      variant = "positive";
    } else if (numValue < 0) {
      variant = "negative";
    } else {
      variant = "neutral";
    }

    // Format with error handling
    let text: string;
    try {
      text = percentFormatter.format(numValue);

      // Validate formatter output
      if (!text || typeof text !== "string") {
        console.warn("[formatPercent] Invalid formatter output:", text);
        text = `${(numValue * 100).toFixed(0)}%`;
      }
    } catch (formatError) {
      console.error("[formatPercent] Formatter error:", formatError);
      // Fallback formatting
      const percentage = (numValue * 100).toFixed(0);
      text = numValue >= 0 ? `+${percentage}%` : `${percentage}%`;
    }

    return { text, variant };
  } catch (error) {
    // CRITICAL: Prevent any error from breaking the component
    console.error("[formatPercent] Caught error formatting percent:", {
      deltaPct,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      text: "—",
      variant: "neutral",
    };
  }
}

/**
 * Extrae el label del último segmento de un path
 * CRITICAL: Error barriers to prevent callstack errors that could block GA access
 */
export function extractLabel(path: string): string {
  try {
    // Input validation
    if (!path || typeof path !== "string") {
      console.warn("[extractLabel] Invalid path input:", path);
      return "/";
    }

    const segments = path.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] ?? "/";

    // Safe URI decoding with fallback
    try {
      const decoded = decodeURIComponent(lastSegment);
      return decoded || lastSegment || "/";
    } catch (decodeError) {
      console.warn(
        "[extractLabel] URI decode error, using raw segment:",
        lastSegment,
        decodeError
      );
      return lastSegment || "/";
    }
  } catch (error) {
    // CRITICAL: Prevent any error from breaking the component
    console.error("[extractLabel] Caught error extracting label:", {
      path,
      error: error instanceof Error ? error.message : String(error),
    });
    return path || "/"; // Fallback to original or root
  }
}

/**
 * Formatea fechas para tooltips según granularidad
 * CRITICAL: Error barriers to prevent callstack errors that could block GA access
 */
export function formatDateTick(
  dateStr: string,
  granularity: "d" | "w" | "m" | "y"
): string {
  try {
    // Input validation - prevent any null/undefined/empty strings
    if (!dateStr || typeof dateStr !== "string" || dateStr.trim() === "") {
      console.warn("[formatDateTick] Invalid dateStr:", dateStr);
      return "Fecha inválida";
    }

    if (granularity === "y") {
      // Monthly format: "YYYY-MM" -> "MMM YYYY"
      const parts = dateStr.split("-");
      if (parts.length < 2) {
        console.warn(
          "[formatDateTick] Invalid date format for yearly granularity:",
          dateStr
        );
        return dateStr; // Fallback to original string
      }

      const yearNum = parseInt(parts[0]);
      const monthNum = parseInt(parts[1]);

      // Validate year and month ranges
      if (
        isNaN(yearNum) ||
        isNaN(monthNum) ||
        yearNum < 1900 ||
        yearNum > 2100 ||
        monthNum < 1 ||
        monthNum > 12
      ) {
        console.warn("[formatDateTick] Invalid year/month values:", {
          year: yearNum,
          month: monthNum,
        });
        return dateStr; // Fallback to original string
      }

      const date = new Date(yearNum, monthNum - 1, 1);

      // Validate the created date is valid
      if (isNaN(date.getTime())) {
        console.warn(
          "[formatDateTick] Created invalid Date object for yearly:",
          dateStr
        );
        return dateStr;
      }

      return new Intl.DateTimeFormat("es-ES", {
        month: "short",
        year: "numeric",
      }).format(date);
    } else {
      // Daily format: "YYYY-MM-DD" -> "DD MMM"
      // Validate date string format
      if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.warn(
          "[formatDateTick] Invalid date format for daily granularity:",
          dateStr
        );
        return dateStr; // Fallback to original string
      }

      const date = new Date(dateStr + "T00:00:00");

      // Validate the created date is valid
      if (isNaN(date.getTime())) {
        console.warn(
          "[formatDateTick] Created invalid Date object for daily:",
          dateStr
        );
        return dateStr;
      }

      return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
      }).format(date);
    }
  } catch (error) {
    // CRITICAL: Prevent any error from breaking the entire component
    console.error("[formatDateTick] Caught error formatting date:", {
      dateStr,
      granularity,
      error: error instanceof Error ? error.message : String(error),
    });
    return dateStr || "Error fecha"; // Safe fallback
  }
}
