/**
 * /lib/utils/data/types.ts
 * Tipos compartidos para manejo de datos de GA4
 */

/**
 * Tipo para filas de GA4
 */
export type GA4Row = {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
};
