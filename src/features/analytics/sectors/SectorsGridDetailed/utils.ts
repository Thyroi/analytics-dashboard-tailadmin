import { orderIdsByTaxonomy } from "@/lib/utils/core/sector";
import type { Mode } from "./types";

/* ---------- type guards ---------- */
function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

export function extractImageSrc(iconCandidate: unknown): string | null {
  if (typeof iconCandidate === "string") return iconCandidate;
  if (isRecord(iconCandidate) && "src" in iconCandidate) {
    const srcVal = (iconCandidate as { src: unknown }).src;
    return typeof srcVal === "string" ? srcVal : null;
  }
  return null;
}

export function getOrderedIds(mode: Mode, ids: string[]): string[] {
  return orderIdsByTaxonomy(mode, ids);
}
