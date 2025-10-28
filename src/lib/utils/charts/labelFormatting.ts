// Utility function to format chart labels based on granularity
import { formatDateTick } from "@/lib/analytics/format";

/**
 * Formats chart labels based on granularity to avoid overcrowded labels
 *
 * @param labels - Array of date labels from the API
 * @param granularity - The granularity (d, w, m, y)
 * @returns Formatted labels array
 */
export function formatChartLabels(
  labels: string[],
  granularity: "d" | "w" | "m" | "y"
): string[] {
  if (!labels || labels.length === 0) {
    return [];
  }

  return labels.map((label) => {
    try {
      const dateStr = String(label);

      // For yearly granularity, show only month
      if (granularity === "y") {
        // Parse the date and extract month
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          // If it's already in YYYY-MM format, just extract MM
          if (dateStr.includes("-")) {
            const parts = dateStr.split("-");
            if (parts.length >= 2) {
              const month = parseInt(parts[1]);
              const monthNames = [
                "Ene",
                "Feb",
                "Mar",
                "Abr",
                "May",
                "Jun",
                "Jul",
                "Ago",
                "Sep",
                "Oct",
                "Nov",
                "Dic",
              ];
              return monthNames[month - 1] || `M${month}`;
            }
          }
          return dateStr; // Fallback to original
        }

        // Format as short month name
        const monthNames = [
          "Ene",
          "Feb",
          "Mar",
          "Abr",
          "May",
          "Jun",
          "Jul",
          "Ago",
          "Sep",
          "Oct",
          "Nov",
          "Dic",
        ];
        return monthNames[date.getMonth()] || `M${date.getMonth() + 1}`;
      }

      // For d, w, m granularities, show only day
      const formattedDate = formatDateTick(dateStr, granularity);

      // Extract only the day part (assuming format like "Oct 15" or "15/10")
      if (formattedDate.includes(" ")) {
        // Format like "Oct 15" -> "15"
        const parts = formattedDate.split(" ");
        const dayPart = parts[parts.length - 1];
        return dayPart;
      } else if (formattedDate.includes("/")) {
        // Format like "15/10" -> "15"
        const parts = formattedDate.split("/");
        return parts[0];
      } else if (formattedDate.includes("-")) {
        // Format like "2025-10-15" -> "15"
        const parts = formattedDate.split("-");
        return parts[parts.length - 1];
      }

      // If we can't parse it, try to extract numbers
      const dayMatch = formattedDate.match(/\d+/);
      return dayMatch ? dayMatch[0] : formattedDate;
    } catch {
      return String(label);
    }
  });
}

/**
 * Alternative simpler version that just extracts day/month based on granularity
 */
export function formatChartLabelsSimple(
  labels: string[],
  granularity: "d" | "w" | "m" | "y"
): string[] {
  if (!labels || labels.length === 0) {
    return [];
  }

  const formatted = labels.map((label) => {
    const dateStr = String(label);

    if (granularity === "y") {
      // For yearly, show month abbreviation from YYYY-MM format
      if (dateStr.includes("-")) {
        const parts = dateStr.split("-");
        if (parts.length >= 2) {
          const month = parseInt(parts[1]);
          const monthNames = [
            "Ene",
            "Feb",
            "Mar",
            "Abr",
            "May",
            "Jun",
            "Jul",
            "Ago",
            "Sep",
            "Oct",
            "Nov",
            "Dic",
          ];
          return monthNames[month - 1] || `M${month}`;
        }
      }

      // Fallback: try Date parsing
      const date = new Date(dateStr + "-01"); // Add day to make valid date
      if (!isNaN(date.getTime())) {
        const monthNames = [
          "Ene",
          "Feb",
          "Mar",
          "Abr",
          "May",
          "Jun",
          "Jul",
          "Ago",
          "Sep",
          "Oct",
          "Nov",
          "Dic",
        ];
        return monthNames[date.getMonth()] || `M${date.getMonth() + 1}`;
      }

      return dateStr;
    } else {
      // Para granularidad diaria, mostrar formato completo dd-mmm-yyyy
      if (granularity === "d") {
        if (dateStr.includes("-")) {
          const parts = dateStr.split("-");
          if (parts.length === 3) {
            const year = parts[0];
            const month = parseInt(parts[1]);
            const day = parts[2];

            const monthNames = [
              "Ene",
              "Feb",
              "Mar",
              "Abr",
              "May",
              "Jun",
              "Jul",
              "Ago",
              "Sep",
              "Oct",
              "Nov",
              "Dic",
            ];

            const monthName = monthNames[month - 1] || `M${month}`;
            return `${day}-${monthName}-${year}`;
          }
        }

        // Fallback usando Date
        const date = new Date(dateStr + "T12:00:00Z");
        if (!isNaN(date.getTime())) {
          const monthNames = [
            "Ene",
            "Feb",
            "Mar",
            "Abr",
            "May",
            "Jun",
            "Jul",
            "Ago",
            "Sep",
            "Oct",
            "Nov",
            "Dic",
          ];
          const day = date.getUTCDate();
          const month = monthNames[date.getUTCMonth()];
          const year = date.getUTCFullYear();
          return `${day}-${month}-${year}`;
        }
      } else {
        // For w, m: show only day number
        // Evitar problemas de timezone usando parsing directo de string ISO
        if (dateStr.includes("-")) {
          const parts = dateStr.split("-");
          if (parts.length === 3) {
            // YYYY-MM-DD format - tomar el día directamente
            return parts[2];
          }
          return parts[parts.length - 1]; // Last part should be day
        }

        // Fallback: try Date parsing as last resort
        const date = new Date(dateStr + "T12:00:00Z"); // Add noon UTC to avoid timezone issues
        if (!isNaN(date.getTime())) {
          return date.getUTCDate().toString();
        }
      }

      return dateStr;
    }
  });

  return formatted;
}
