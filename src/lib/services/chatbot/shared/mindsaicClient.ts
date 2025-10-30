/**
 * Cliente para comunicación con API de Mindsaic (/api/chatbot/audit/tags)
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import {
  getCategorySearchPattern,
  getTownSearchPattern,
} from "@/lib/taxonomy/patterns";
import type { TownId } from "@/lib/taxonomy/towns";
import type { MindsaicResponse } from "./types";

/**
 * Hace un POST a /api/chatbot/audit/tags para obtener datos de un town
 */
export async function fetchMindsaicDataForTown(
  townId: TownId,
  startTime: string,
  endTime: string,
  db: string,
  signal: AbortSignal
): Promise<MindsaicResponse> {
  const { token, wildcard } = getTownSearchPattern(townId);
  const payload = {
    db,
    // Pattern nivel 1: solo hasta depth=3 (categorías)
    patterns: wildcard
      ? `root.${token} *.*` // 2 wildcards para capturar town + category
      : `root.${token}.*`, // 1 wildcard para category
    granularity: "d",
    startTime,
    endTime,
  };

  const response = await fetch("/api/chatbot/audit/tags", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json = (await response.json()) as MindsaicResponse;

  return json;
}

/**
 * Hace un POST a /api/chatbot/audit/tags para obtener datos de una categoría
 */
export async function fetchMindsaicDataForCategory(
  categoryId: CategoryId,
  startTime: string,
  endTime: string,
  db: string,
  signal: AbortSignal
): Promise<MindsaicResponse> {
  const { token, wildcard } = getCategorySearchPattern(categoryId);
  const payload = {
    db,
    patterns: wildcard
      ? `root.${token} *.*` // 2 wildcards para capturar category + town
      : `root.${token}.*`, // 1 wildcard para town
    granularity: "d",
    startTime,
    endTime,
  };

  const response = await fetch("/api/chatbot/audit/tags", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json = (await response.json()) as MindsaicResponse;

  return json;
}

/**
 * Hace una query genérica a /api/chatbot/audit/tags
 */
export async function fetchMindsaicData(
  pattern: string,
  startTime: string,
  endTime: string,
  db: string,
  signal: AbortSignal
): Promise<MindsaicResponse> {
  const payload = {
    db,
    patterns: pattern,
    granularity: "d",
    startTime,
    endTime,
  };

  const response = await fetch("/api/chatbot/audit/tags", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json = (await response.json()) as MindsaicResponse;

  return json;
}
