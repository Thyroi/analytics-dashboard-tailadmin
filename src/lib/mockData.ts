// Datos "quemados": series diarias por tagPath
export type SeriesDict = Record<string, Record<string, number>>;

export const SERIES: SeriesDict = {
  "playa": { "2025-08-01":120, "2025-08-02":130, "2025-08-03":100 },
  "playa.limpieza": { "2025-08-01":40, "2025-08-02":50, "2025-08-03":35 },
  "playa.ubicacion": { "2025-08-01":32, "2025-08-02":28, "2025-08-03":24 },
  "playa.chiringuitos": { "2025-08-01":25, "2025-08-02":30, "2025-08-03":18 },
  "museos": { "2025-08-01":80, "2025-08-02":70, "2025-08-03":90 },
  "museos.horarios": { "2025-08-01":24, "2025-08-02":20, "2025-08-03":27 },
  "museos.precios": { "2025-08-01":22, "2025-08-02":19, "2025-08-03":25 },
  "gastronomia": { "2025-08-01":60, "2025-08-02":65, "2025-08-03":62 },
  "gastronomia.tapas": { "2025-08-01":18, "2025-08-02":20, "2025-08-03":19 },
};
