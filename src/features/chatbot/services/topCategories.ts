import type { Granularity } from "@/lib/types";
import { aggregateCategoriesForUI } from "@/lib/utils/aggregateCategories";

function formatDateForGranularity(
  date: string,
  granularity: Granularity
): string {
  if (!date) return "";
  if (granularity === "d") return date.replace(/-/g, ""); // yyyymmdd
  if (granularity === "w") {
    // yyyy/ww (ISO week)
    const d = new Date(date);
    const year = d.getUTCFullYear();
    // Get week number
    const jan1 = new Date(Date.UTC(year, 0, 1));
    const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
    const week = Math.ceil((days + jan1.getUTCDay() + 1) / 7);
    return `${year}/${String(week).padStart(2, "0")}`;
  }
  if (granularity === "m") {
    // yyyy/mm
    const d = new Date(date);
    return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(
      2,
      "0"
    )}`;
  }
  if (granularity === "y") {
    // yyyy
    const d = new Date(date);
    return `${d.getUTCFullYear()}`;
  }
  return date;
}

export async function getTopCategories({
  patterns,
  granularity,
  startTime,
  endTime,
  db,
}: {
  patterns: string[];
  granularity: Granularity;
  startTime?: string;
  endTime?: string;
  db?: string;
}) {
  // Formatear fechas según granularidad
  const formattedStart = startTime
    ? formatDateForGranularity(startTime, granularity)
    : undefined;
  const formattedEnd = endTime
    ? formatDateForGranularity(endTime, granularity)
    : undefined;

  const res = await fetch("/api/chatbot/top-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patterns,
      granularity,
      startTime: formattedStart,
      endTime: formattedEnd,
      db,
    }),
  });
  if (!res.ok) throw new Error("Error fetching top categories");
  const data = await res.json();

  // Usar la nueva función de agregación que maneja correctamente las sumas
  const aggregatedCategories = aggregateCategoriesForUI(data.output);


  const items = aggregatedCategories
    .map((cat) => ({
      key: cat.id,
      value: cat.value,
      time: "", 
    }))
    .slice(0, 10);

  console.log("📈 Resultado final con nueva función:", items);

  return items;
}
