export async function getTopCategories({
  patterns,
  granularity,
  startTime,
  endTime,
  db,
}: {
  patterns: string[];
  granularity: string;
  startTime?: string;
  endTime?: string;
  db?: string;
}) {
  const res = await fetch("/api/chatbot/top-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patterns, granularity, startTime, endTime, db }),
  });
  if (!res.ok) throw new Error("Error fetching top categories");
  const data = await res.json();
  // Filtrar solo categorías (no pueblos)
  const items = Object.entries(data.output)
    .filter(([key]) => !/^root\.[A-Z]/.test(key)) // Excluye pueblos (mayúsculas)
    .map(([key, arr]) => {
      const points = arr as { value: number; time: string }[];
      return {
        key,
        value: points[0]?.value ?? 0,
        time: points[0]?.time ?? "",
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  return items;
}
