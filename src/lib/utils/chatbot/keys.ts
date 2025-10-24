export function splitKey(key: string): string[] {
  return key.split(".");
}

export function depthOf(key: string): number {
  return splitKey(key).length;
}

export function isTownSummary(key: string): boolean {
  const parts = splitKey(key);
  return parts.length === 2 && parts[0] === "root";
}

export function isTownCategorySummary(key: string): boolean {
  const parts = splitKey(key);
  return parts.length === 3 && parts[0] === "root";
}

export function isTownCategorySubcatSummary(key: string): boolean {
  const parts = splitKey(key);
  return parts.length === 4 && parts[0] === "root";
}
