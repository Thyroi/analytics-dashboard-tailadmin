# DRILLDOWN WORKFLOW COMPLETO - ANALYTICS BY TOWN SECTION

**Fecha:** 26 de octubre de 2025
**Problema:** Nivel 2 del drilldown muestra solo 1 punto de datos en todas las granularidades
**Alcance:** Workflow completo desde DeltaCards hasta drilldown nivel 3

---

## ÍNDICE

1. [Arquitectura General](#1-arquitectura-general)
2. [Context: TownTimeProvider](#2-context-towntimeprovider)
3. [Nivel 0: Delta Cards (Grid Colapsado)](#3-nivel-0-delta-cards-grid-colapsado)
4. [Nivel 1: Pueblo Expandido](#4-nivel-1-pueblo-expandido)
5. [Nivel 2: Drilldown Pueblo+Categoría](#5-nivel-2-drilldown-pueblocategoria)
6. [Nivel 3: URL Individual](#6-nivel-3-url-individual)
7. [Backend Endpoints](#7-backend-endpoints)
8. [Comportamiento de Granularidad](#8-comportamiento-de-granularidad)
9. [Diagnóstico del Problema](#9-diagnostico-del-problema)
10. [Solución Propuesta](#10-solucion-propuesta)

---

## 1. COMPONENTE PRINCIPAL: TownCategoryDrilldownPanel.tsx

**Ubicación:** `src/features/analytics/sectors/expanded/SectorExpandedCardDetailed/TownCategoryDrilldownPanel.tsx`

**Props recibidas:**

```typescript
{
  townId: TownId;           // e.g., "almonte"
  categoryId: CategoryId;   // e.g., "playas"
  granularity: Granularity; // "d" | "w" | "m" | "y"
  startISO?: string;        // "2025-09-26"
  endISO?: string;          // "2025-10-25"
  headline: "town" | "category";
  headlinePercent?: number;
  color?: "dark" | "primary" | "secondary";
}
```

**Flujo de datos:**

```
TownCategoryDrilldownPanel
    │
    ├─► 1. useDrilldownDetails (pueblo + categoryId filter)
    │       │
    │       └─► API: /api/analytics/v1/dimensions/pueblos/details/almonte?categoryId=playas&granularity=m&startDate=2025-09-26&endDate=2025-10-25
    │           │
    │           └─► Retorna: { series, donutData, deltaPct }
    │                        - series: Array de puntos (AGREGADOS por pueblo+categoría)
    │                        - donutData: [{ label: url1, value }, { label: url2, value }, ...]
    │
    ├─► 2. useUrlSeries (para cada URL del donut)
    │       │
    │       └─► Para cada URL en donutData:
    │           API: /api/analytics/v1/drilldown/url?path={url}&granularity=m&startDate=2025-09-26&endDate=2025-10-25
    │           │
    │           └─► Retorna: { seriesAvgEngagement, xLabels, kpis, ... }
    │                        - seriesAvgEngagement: Serie de puntos POR URL
    │                        - xLabels: Labels del eje X
    │
    └─► 3. useDrilldownTransformation (combina ambos)
            │
            └─► Combina:
                - drilldown.donut (lista de URLs)
                - urlSeries.seriesByUrl (series individuales de cada URL)
                │
                └─► Retorna: { seriesByUrl, xLabels, donut, deltaPct, colorsByName }
```

---

## 2. HOOK 1: useDrilldownDetails

**Ubicación:** `src/features/analytics/hooks/useDrilldownDetails.ts`

**Propósito:** Obtener datos agregados de pueblo+categoría y lista de URLs

**Parámetros:**

```typescript
{
  type: "pueblo-category",
  townId: "almonte",
  categoryId: "playas",
  granularity: "m",
  startISO: "2025-09-26",
  endISO: "2025-10-25"
}
```

**URL construida:**

```
/api/analytics/v1/dimensions/pueblos/details/almonte?categoryId=playas&granularity=m&startDate=2025-09-26&endDate=2025-10-25
```

**Retorna:**

```typescript
{
  loading: false,
  response: DrilldownResponse,
  donut: [
    { label: "https://example.com/almonte/playa1", value: 1500 },
    { label: "https://example.com/almonte/playa2", value: 1200 },
    { label: "https://example.com/almonte/playa3", value: 800 }
  ],
  deltaPct: 15.5
}
```

**⚠️ PROBLEMA IDENTIFICADO:**

- El endpoint `/dimensions/pueblos/details/[id]` fue diseñado para NIVEL 1 (expansión de pueblo)
- Cuando se agrega `categoryId`, filtra las filas pero retorna **series agregadas** del pueblo+categoría
- NO retorna series individuales por URL
- Las URLs solo aparecen en el donutData, pero la serie es agregada

---

## 3. ENDPOINT BACKEND: /dimensions/pueblos/details/[id]

**Ubicación:** `src/app/api/analytics/v1/dimensions/pueblos/details/[id]/route.ts`

**Parámetros recibidos:**

```typescript
{
  id: "almonte",
  searchParams: {
    granularity: "m",
    startDate: "2025-09-26",
    endDate: "2025-10-25",
    categoryId: "playas"  // ← FILTRO PARA DRILLDOWN
  }
}
```

**Proceso actual:**

1. **Valida pueblo** ✅
2. **Calcula rangos** usando `calculatePreviousPeriodOnly(startDate, endDate)` ✅
3. **Consulta GA4** con `buildPageViewUnionRequest` ✅
4. **Pre-filtro (si hay categoryId):**
   ```typescript
   const filteredRows = categoryFilter
     ? rows.filter((r) => {
         const url = String(r.dimensionValues?.[1]?.value ?? "");
         const path = safeUrlPathname(url);
         const categoryId = matchCategoryIdFromPath(path);
         return categoryId === categoryFilter;
       })
     : rows;
   ```
5. **Procesa datos** con `mapDataByGranularity` ✅

   - **⚠️ AQUÍ ESTÁ EL PROBLEMA:**
     ```typescript
     const {
       currentSeries, // ← Serie AGREGADA de todas las URLs filtradas
       previousSeries, // ← Serie AGREGADA del período anterior
       totalCurrent,
       totalPrevious,
       xLabels,
       previousLabels,
     } = mapDataByGranularity(
       actualGranularity,
       filteredRows as GA4Row[], // ← Filas filtradas por categoría
       matchTownIdFromPath,
       townId,
       ranges
     );
     ```

6. **Genera donut:**

   ```typescript
   const donutData = categoryFilter
     ? buildUrlsDonutForTownCategory(...)  // ← Lista de URLs con valores
     : buildCategoriesDonutForTown(...);
   ```

7. **Retorna:**
   ```typescript
   {
     series: {
       current: [...],  // ← Serie AGREGADA de 30 puntos
       previous: [...]
     },
     donutData: [
       { label: "url1", value: 1500 },
       { label: "url2", value: 1200 },
       { label: "url3", value: 800 }
     ],
     deltaPct: 15.5
   }
   ```

**🔴 DIAGNÓSTICO:**

- El endpoint filtra correctamente las filas por `categoryId`
- Pero `mapDataByGranularity` **agrega todas las filas filtradas en una sola serie**
- NO genera series separadas por URL
- El resultado es una serie agregada de 30 puntos (para granularidad "m") que representa el total de todas las URLs combinadas

---

## 4. HOOK 2: useUrlSeries

**Ubicación:** `src/features/analytics/hooks/useUrlSeries.ts`

**Propósito:** Obtener series individuales para cada URL

**Parámetros:**

```typescript
{
  urls: [
    "https://example.com/almonte/playa1",
    "https://example.com/almonte/playa2",
    "https://example.com/almonte/playa3"
  ],
  granularity: "m",
  startISO: "2025-09-26",
  endISO: "2025-10-25"
}
```

**Proceso:**

1. Verifica caché de React Query
2. Para cada URL no cacheada, construye query:

   ```typescript
   const params = new URLSearchParams();
   params.set("path", url);
   params.set("granularity", "m");
   params.set("startDate", "2025-09-26");
   params.set("endDate", "2025-10-25");

   const fullUrl = `/api/analytics/v1/drilldown/url?${params.toString()}`;
   console.log("📊 URL SERIES REQUEST:", fullUrl);
   ```

3. Ejecuta queries en paralelo con `useQueries`
4. Combina resultados cacheados + nuevos
5. Retorna:
   ```typescript
   {
     loading: false,
     seriesByUrl: [
       { name: "playa1", data: [10, 15, 20, ...], path: "url1" },
       { name: "playa2", data: [8, 12, 18, ...], path: "url2" },
       { name: "playa3", data: [5, 8, 10, ...], path: "url3" }
     ],
     xLabels: ["2025-09-26", "2025-09-27", ...]
   }
   ```

**⚠️ PREGUNTA CRÍTICA:**

- ¿Se está ejecutando este hook?
- ¿Aparecen los logs "📊 URL SERIES REQUEST"?
- ¿El array `urls` está poblado correctamente?

---

## 5. ENDPOINT BACKEND: /drilldown/url

**Ubicación:** `src/app/api/analytics/v1/drilldown/url/route.ts`

**Parámetros recibidos:**

```typescript
{
  searchParams: {
    path: "https://example.com/almonte/playa1",  // ← URL COMPLETA
    granularity: "m",
    startDate: "2025-09-26",
    endDate: "2025-10-25"
  }
}
```

**Proceso:**

1. **Valida path** ✅
2. **Determina endISO** (usa parámetro o ayer) ✅
3. **Construye axis:**

   ```typescript
   if (startISOParam) {
     // Rango personalizado
     const customRange = { start: startISOParam, end: endISO };
     const ga4Granularity = determineGA4Granularity(g);

     axis = {
       dimensionTime: ga4Granularity === "y" ? "yearMonth" : "date",
       queryRange: customRange,
       curRange: customRange,
       prevRange: { start: startISOParam, end: endISO },
       xLabels: [customRange.start],  // ← ⚠️ Simplified
       ...
     };
   } else {
     // Usa buildLaggedAxisForGranularity
     axis = buildLaggedAxisForGranularity(g, { endISO });
   }
   ```

4. **Consulta GA4 para series:**

   ```typescript
   const seriesFilters = [
     {
       filter: {
         fieldName: "eventName",
         stringFilter: { matchType: "EXACT", value: "page_view" },
       },
     },
     {
       filter: {
         fieldName: "pageLocation",
         stringFilter: { matchType: "EXACT", value: targetUrl },
       },
     },
   ];
   ```

5. **Procesa filas** y llena vectores por bucket ✅
6. **Consulta GA4 para KPIs** usando `fetchUrlTotalsAggregated` ✅
7. **Consulta GA4 para donuts** (operatingSystems, devices, countries) ✅
8. **Retorna:**
   ```typescript
   {
     granularity: "m",
     range: { current: {...}, previous: {...} },
     context: { path: "/almonte/playa1" },
     xLabels: ["2025-09-26", "2025-09-27", ...],  // ← 30 labels
     seriesAvgEngagement: {
       current: [{ label: "2025-09-26", value: 45 }, ...],  // ← 30 puntos
       previous: [...]
     },
     kpis: { current: {...}, previous: {...}, deltaPct: {...} },
     operatingSystems: [...],
     devices: [...],
     countries: [...],
     deltaPct: 15.5
   }
   ```

**⚠️ POSIBLE PROBLEMA:**

```typescript
xLabels: [customRange.start],  // ← Solo 1 label cuando hay startISOParam
```

Esto podría estar causando que solo haya 1 punto en el gráfico.

---

## 6. HOOK 3: useDrilldownTransformation

**Ubicación:** `src/features/analytics/hooks/useDrilldownTransformation.ts`

**Propósito:** Combinar datos de drilldown + urlSeries

**Parámetros:**

```typescript
{
  drilldown: {
    loading: false,
    donut: [
      { label: "url1", value: 1500 },
      { label: "url2", value: 1200 },
      { label: "url3", value: 800 }
    ],
    deltaPct: 15.5
  },
  urlSeries: {
    loading: false,
    seriesByUrl: [
      { name: "playa1", data: [10, 15, 20, ...], path: "url1" },
      { name: "playa2", data: [8, 12, 18, ...], path: "url2" },
      { name: "playa3", data: [5, 8, 10, ...], path: "url3" }
    ],
    xLabels: ["2025-09-26", "2025-09-27", ...]
  }
}
```

**Proceso:**

1. Si cualquiera está loading, retorna loading
2. Si `urlSeries.seriesByUrl.length === 0`, retorna vacío
3. Mapea donut items a series reales:

   ```typescript
   const seriesByUrl = drilldown.donut
     .map((item) => {
       const realData = urlSeries.seriesByUrl.find(
         (series) => series.path === item.label || series.name === item.label
       );

       if (!realData) return null;

       return {
         name: formatUrlForDisplay(item.label),
         data: realData.data,
         path: item.label,
       };
     })
     .filter((item) => item !== null);
   ```

4. Genera colores por ranking de valor
5. Retorna:
   ```typescript
   {
     loading: false,
     xLabels: ["2025-09-26", "2025-09-27", ...],
     seriesByUrl: [
       { name: "Playa 1", data: [10, 15, 20, ...], path: "url1" },
       { name: "Playa 2", data: [8, 12, 18, ...], path: "url2" },
       { name: "Playa 3", data: [5, 8, 10, ...], path: "url3" }
     ],
     donut: [
       { id: "url1", label: "Playa 1", value: 1500, color: "#902919" },
       { id: "url2", label: "Playa 2", value: 1200, color: "#E55338" },
       { id: "url3", label: "Playa 3", value: 800, color: "#F5AA35" }
     ],
     deltaPct: 15.5,
     colorsByName: { "Playa 1": "#902919", ... }
   }
   ```

**⚠️ DEPENDENCIAS:**

- Este hook **SOLO usa datos de urlSeries** para las series
- NO usa drilldown.series (que está agregada)
- Si urlSeries está vacío o con 1 punto, el resultado tendrá 1 punto

---

## 7. DIAGNÓSTICO FINAL

### Problema Confirmado:

**El componente TownCategoryDrilldownPanel está mostrando solo 1 punto de datos porque:**

1. **useDrilldownDetails** llama al endpoint de pueblo que retorna serie **agregada** (no por URL)
2. **useUrlSeries** debería llamar al endpoint `/drilldown/url` para cada URL
3. **Pero el endpoint `/drilldown/url` tiene un bug:**

   ```typescript
   // Cuando viene startISOParam:
   xLabels: [customRange.start],  // ← SOLO 1 LABEL
   curKeys: [customRange.start.replace(/-/g, "")],  // ← SOLO 1 KEY
   ```

   Esto causa que:

   - Solo haya 1 bucket en el eje X
   - Solo se mapee 1 punto de datos
   - El gráfico muestre solo 1 punto

### Verificación Necesaria:

1. ¿Aparecen los logs "📊 URL SERIES REQUEST" en la consola?

   - **SI:** El problema está en el endpoint `/drilldown/url` (xLabels con 1 elemento)
   - **NO:** El problema está en useUrlSeries no ejecutándose (urls vacío o condición enabled)

2. ¿Qué contiene el log "🔍 URLs to fetch"?
   - Debe mostrar array de 3 URLs
   - Debe mostrar startISO y endISO correctos

---

## 8. SOLUCIÓN PROPUESTA

### Si useUrlSeries NO se ejecuta:

**Revisar TownCategoryDrilldownPanel.tsx línea 56-61:**

```typescript
const urlsToFetch = useMemo(() => {
  if (drilldown.loading) return []; // ← ¿Se está quedando aquí?
  const urls = drilldown.donut.map((item) => item.label);
  console.log(
    "🔍 URLs to fetch:",
    urls,
    "startISO:",
    startISO,
    "endISO:",
    endISO
  );
  return urls;
}, [drilldown, startISO, endISO]);
```

### Si useUrlSeries se ejecuta pero retorna 1 punto:

**Arreglar /drilldown/url/route.ts línea ~180-195:**

```typescript
if (startISOParam) {
  const customRange = { start: startISOParam, end: endISO };
  const ga4Granularity = determineGA4Granularity(g);

  // ❌ INCORRECTO:
  axis = {
    xLabels: [customRange.start],  // Solo 1 label
    ...
  };

  // ✅ CORRECTO:
  // Usar buildLaggedAxisForGranularity incluso con startISOParam
  // O generar xLabels correctos basados en granularidad:
  const xLabels = generateLabelsForRange(startISOParam, endISO, g);
  axis = {
    xLabels: xLabels,  // Array completo de labels
    ...
  };
}
```

---

## 9. ACCIÓN INMEDIATA REQUERIDA

**ANTES DE HACER CUALQUIER CAMBIO:**

1. Usuario debe recargar y proveer:

   - Output del log "🔍 URLs to fetch:"
   - Si aparece "📊 URL SERIES REQUEST:" (y cuántas veces)
   - Cualquier mensaje de error en consola

2. Con esa información, podemos confirmar:
   - Si el problema es en useUrlSeries (no ejecuta)
   - O en /drilldown/url (retorna 1 punto)

**NO MODIFICAR CÓDIGO HASTA TENER ESTA CONFIRMACIÓN**

---

## 10. ARCHIVO DE PRUEBA PARA DIAGNÓSTICO

Si necesitas verificar el problema manualmente:

```bash
# Test endpoint de pueblo (NIVEL 1):
curl "http://localhost:3000/api/analytics/v1/dimensions/pueblos/details/almonte?granularity=m&startDate=2025-09-26&endDate=2025-10-25&categoryId=playas"

# Verificar:
# - series.current.length debería ser 30 (para granularidad "m")
# - donutData.length debería ser 3
# - series es agregada (no por URL)

# Test endpoint de URL individual (NIVEL 2):
curl "http://localhost:3000/api/analytics/v1/drilldown/url?path=https://example.com/almonte/playa1&granularity=m&startDate=2025-09-26&endDate=2025-10-25"

# Verificar:
# - xLabels.length debería ser 30 (NO 1)
# - seriesAvgEngagement.current.length debería ser 30
```

---

**FIN DEL REPORTE**
