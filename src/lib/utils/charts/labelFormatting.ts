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
    } catch (error) {
      console.warn("[formatChartLabels] Error formatting label:", label, error);
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
      // For yearly, show month abbreviation
      const date = new Date(dateStr);
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
      // Fallback: extract month from YYYY-MM format
      if (dateStr.includes("-")) {
        const month = parseInt(dateStr.split("-")[1]);
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
      return dateStr;
    } else {
      // For d, w, m: show only day number
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.getDate().toString();
      }
      // Fallback: extract day from various formats
      if (dateStr.includes("-")) {
        const parts = dateStr.split("-");
        return parts[parts.length - 1]; // Last part should be day
      }
      return dateStr;
    }
  });

  return formatted;
}
