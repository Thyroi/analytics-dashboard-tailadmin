/**
 * Helper compartido para conversión de timestamps de chatbot
 */

/**
 * Convierte un timestamp de chatbot (YYYYMMDD) a formato ISO (YYYY-MM-DD)
 */
export function chatbotTimeToISO(time: string): string {
  return `${time.slice(0, 4)}-${time.slice(4, 6)}-${time.slice(6, 8)}`;
}

/**
 * Convierte un timestamp de chatbot (YYYYMMDD) a formato de mes (YYYY-MM)
 * Usado para granularidad anual
 */
export function chatbotTimeToMonth(time: string): string {
  return `${time.slice(0, 4)}-${time.slice(4, 6)}`;
}
