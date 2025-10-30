export function getDeltaColor(delta: number | null | undefined): string {
  if (delta === undefined || delta === null || delta === 0)
    return "text-gray-500";
  return delta > 0 ? "text-green-600" : "text-red-600";
}

export function getDeltaIcon(delta: number | null | undefined): string {
  if (delta === undefined || delta === null || delta === 0) return "→";
  return delta > 0 ? "↗" : "↘";
}
