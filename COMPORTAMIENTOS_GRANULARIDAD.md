# Comportamientos de Granularidad en Analytics Dashboard

Este documento explica los dos comportamientos diferentes para manejar datos según el tipo de visualización.

## 📊 Dos Tipos de Comportamiento

### 1. **COMPORTAMIENTO SERIE (Series/Gráficos de Línea)**

Para visualizaciones que muestran evolución temporal con puntos de datos individuales.

**Archivos relacionados:**

- `src/lib/utils/time/timeWindows.ts` → `computeRangesFromQuery()`
- Endpoints de drilldown y detalles de dimensiones
- Componentes de gráficos de línea y series temporales

**Lógica por granularidad:**

| Granularidad   | Current (Actual)  | Previous (Comparación)     | Shift   |
| -------------- | ----------------- | -------------------------- | ------- |
| **d** (día)    | Último día (ayer) | Día anterior (hace 2 días) | 1 día   |
| **w** (semana) | Últimos 7 días    | 7 días anteriores          | 7 días  |
| **m** (mes)    | Últimos 30 días   | 30 días anteriores         | 30 días |
| **y** (año)    | Últimos 365 días  | 365 días anteriores        | 1 año   |

**Ejemplo (d):**

```
Hoy: 2025-10-14
Current:  2025-10-13 → 2025-10-13 (1 día)
Previous: 2025-10-12 → 2025-10-12 (1 día)
```

**Ejemplo (w):**

```
Hoy: 2025-10-14
Current:  2025-10-07 → 2025-10-13 (7 días)
Previous: 2025-09-30 → 2025-10-06 (7 días)
```

### 2. **COMPORTAMIENTO DONUT/KPI (Agregación)**

Para visualizaciones que muestran totales agregados sin evolución temporal.

**Archivos relacionados:**

- `src/lib/utils/time/dateRangeWindow.ts` → `deriveRangeEndingYesterday()` + `derivePrevShifted()`
- `src/app/api/analytics/v1/header/kpis/route.ts`
- Endpoints de donuts (dispositivos, países, OS, etc.)

**Lógica por granularidad:**

| Granularidad   | Current (Actual)       | Previous (Comparación) | Shift   |
| -------------- | ---------------------- | ---------------------- | ------- |
| **d** (día)    | Solo último día (ayer) | Solo día anterior      | 1 día   |
| **w** (semana) | Últimos 7 días         | 7 días anteriores      | 7 días  |
| **m** (mes)    | Últimos 30 días        | 30 días anteriores     | 30 días |
| **y** (año)    | Últimos 365 días       | 365 días anteriores    | 1 año   |

**Ejemplo (d):**

```
Hoy: 2025-10-14
Current:  2025-10-13 → 2025-10-13 (1 día)
Previous: 2025-10-12 → 2025-10-12 (1 día)
```

**Ejemplo (w):**

```
Hoy: 2025-10-14
Current:  2025-10-07 → 2025-10-13 (7 días)
Previous: 2025-09-30 → 2025-10-06 (7 días)
```

## 🎯 ¿Cuál Usar?

### Usa **COMPORTAMIENTO SERIE** cuando:

- ✅ Necesitas mostrar evolución temporal (gráficos de línea)
- ✅ Quieres comparar tendencias día a día
- ✅ Los datos se agrupan por fecha en el eje X
- ✅ Ejemplos: Series de engagement, vistas por día, eventos temporales

### Usa **COMPORTAMIENTO DONUT/KPI** cuando:

- ✅ Necesitas totales agregados (KPIs, donuts)
- ✅ No hay evolución temporal en la visualización
- ✅ Los datos se agrupan por categorías (no por fecha)
- ✅ Ejemplos: Total de usuarios, distribución por dispositivo, KPIs de resumen

## 📝 Implementación Correcta

### Para Series/Gráficos:

```typescript
import { computeRangesFromQuery } from "@/lib/utils/time/timeWindows";

const { current, previous } = computeRangesFromQuery(granularity, startQ, endQ);
```

### Para Donuts/KPIs:

```typescript
import {
  deriveRangeEndingYesterday,
  derivePrevShifted,
} from "@/lib/utils/time/dateRangeWindow";

let current, previous;

if (startQ && endQ) {
  current = { start: startQ, end: endQ };
  previous = derivePrevShifted(current, granularity);
} else {
  current = deriveRangeEndingYesterday(granularity);
  previous = derivePrevShifted(current, granularity);
}
```

## ✅ Componentes Actualizados

### Usando COMPORTAMIENTO DONUT/KPI:

- ✅ `/api/analytics/v1/header/kpis` - KPIs principales
- ✅ `/api/analytics/v1/devices` - Distribución por dispositivos
- ✅ `/api/analytics/v1/header/countries` - Distribución por países
- ✅ `/api/analytics/v1/header/devices/os` - Distribución por OS
- ✅ `/api/analytics/v1/header/gender` - Distribución por género (deprecated)

### Usando COMPORTAMIENTO SERIE:

- ✅ Endpoints de drilldown por URL
- ✅ Endpoints de detalles de pueblos/categorías
- ✅ Endpoints de series temporales

## 🔄 Migración

Si necesitas cambiar un endpoint de SERIE a DONUT/KPI:

1. Cambiar el import:

```typescript
// Antes
import { computeRangesFromQuery } from "@/lib/utils/time/timeWindows";

// Después
import {
  deriveRangeEndingYesterday,
  derivePrevShifted,
} from "@/lib/utils/time/dateRangeWindow";
```

2. Actualizar la lógica de rangos (ver ejemplo arriba)

3. Agregar comentarios explicando el comportamiento

## 📚 Referencias

- `granularityRanges.ts` - Funciones individuales por granularidad (SERIE)
- `dateRangeWindow.ts` - Funciones para donuts/KPIs (DONUT/KPI)
- `timeWindows.ts` - Orquestador de rangos (SERIE)
