/**
 * Format duration in seconds to HH:MM:SS or MM:SS format
 */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

/**
 * Humanize a string by replacing dashes/underscores with spaces and capitalizing
 */
function humanize(s: string): string {
  const cleaned = s.replace(/[-_]+/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Derive activity name from URL path
 */
export function deriveActivityFromPath(path: string): string | null {
  if (!path) return null;
  try {
    const decoded = decodeURIComponent(path);
    const parts = decoded.split("/").filter(Boolean);
    const last = parts[parts.length - 1] ?? "";
    if (!last) return null;
    return humanize(last);
  } catch {
    return null;
  }
}
