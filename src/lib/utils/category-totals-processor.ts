/**
 * Utilidades para procesar datos de totales de categorías
 * Incluye funciones para extraer current/prev values cuando se requiera
 */

import type { CategoriesTotalsResponse } from "@/lib/services/categorias/totals";

type CategoryTotalItem = CategoriesTotalsResponse["items"][0];

interface CategoryGridData {
  categoryId: string;
  ga4Value: number;
  ga4PrevValue: number;
  chatbotValue: number;
  chatbotPrevValue: number;
  delta: number | null; // null = sin datos suficientes para calcular
}

/**
 * Procesa los datos de totales - por ahora solo pasa los datos tal como vienen
 * @param categoryTotals - Datos originales de totales
 */
export function processCategoryTotalsData(
  categoryTotals: CategoryTotalItem[]
): CategoryTotalItem[] {
  // La estructura actual ya tiene total y previousTotal
  return categoryTotals;
}

/**
 * Convierte datos procesados al formato requerido por CategoryGrid
 */
export function convertToCategoryGridFormat(processedData: CategoryTotalItem[]): CategoryGridData[] {
  return processedData.map(category => ({
    categoryId: category.id,
    ga4Value: category.total, // Por ahora usamos total como GA4
    ga4PrevValue: category.previousTotal,
    chatbotValue: 0, // Por ahora 0 hasta integrar chatbot
    chatbotPrevValue: 0,
    delta: category.deltaPct || 0
  }));
}