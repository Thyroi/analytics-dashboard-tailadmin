# WORKFLOW COMPLETO: ANALYTICS BY TOWN SECTION

**Fecha:** 26 de octubre de 2025
**Problema Actual:** Nivel 2 del drilldown muestra solo 1 punto de datos en todas las granularidades
**Alcance:** Workflow completo desde DeltaCards hasta drilldown nivel 3

---

## ÍNDICE

1. [Arquitectura General](#1-arquitectura-general)
2. [Context: TownTimeProvider](#2-context-towntimeprovider)
3. [Nivel 0: Delta Cards (Grid Colapsado)](#3-nivel-0-delta-cards-grid-colapsado)
4. [Nivel 1: Pueblo Expandido](#4-nivel-1-pueblo-expandido)
5. [Nivel 2: Drilldown Pueblo+Categoría](#5-nivel-2-drilldown-pueblocategoría)
6. [Nivel 3: URL Individual](#6-nivel-3-url-individual)
7. [Backend Endpoints](#7-backend-endpoints)
8. [Comportamiento de Granularidad](#8-comportamiento-de-granularidad)
9. [Diagnóstico del Problema](#9-diagnóstico-del-problema)
10. [Solución Propuesta](#10-solución-propuesta)

---

## 1. ARQUITECTURA GENERAL

### 1.1 Jerarquía de Componentes

```
AnalyticsByTownSection (Context Provider)
  └─► TownTimeProvider (maneja modo + granularidad + rango)
      └─► AnalyticsByTownSectionInner
          ├─► StickyHeaderSection (controles de granularidad/rango)
          └─► SectorsGrid
              ├─► DeltaCard (collapsed) [NIVEL 0]
              └─► SectorExpandedCardDetailed (expanded) [NIVEL 1]
                  ├─► ChartPair (series + donut)
                  └─► TownCategoryDrilldownPanel [NIVEL 2]
                      ├─► ChartPair (series multi-URL)
                      └─► UrlDetailsPanel [NIVEL 3]
```

### 1.2 Flujo de Datos

```
Usuario selecciona granularidad/rango
    ↓
TownTimeContext calcula rangos current/previous
    ↓
usePueblosTotals → Fetch totales (deltas para cards)
    ↓
Usuario click en DeltaCard
    ↓
useTownDetails → Fetch pueblo details (series + donut categorías)
    ↓
Usuario click en slice del donut (categoría)
    ↓
useDrilldownDetails → Fetch pueblo+categoría (series agregada + donut URLs)
useUrlSeries → Fetch cada URL individual (series por URL)
useDrilldownTransformation → Combina ambos
    ↓
Usuario click en slice del donut (URL)
    ↓
useUrlDrilldown → Fetch URL individual (métricas detalladas)
```

---

## 2. CONTEXT: TownTimeProvider

**Archivo:** `src/features/analytics/context/UnifiedTimeContext.tsx`

### 2.1 Estado del Context

```typescript
type TimeframeState = {
  mode: "granularity" | "range";
  granularity: Granularity; // "d" | "w" | "m" | "y"
  startDate: Date;
  endDate: Date;
  isGranularityLocked: boolean;
};
```

### 2.2 Modos de Operación

#### Modo "granularity" (Preset)

- Usuario selecciona granularidad en el header
- Context calcula preset automático:
  - **"d"**: Ayer (1 día)
  - **"w"**: Últimos 7 días terminando ayer
  - **"m"**: Últimos 30 días terminando ayer
  - **"y"**: Año calendario actual (2024-01-01 hasta ayer)

#### Modo "range" (Custom)

- Usuario selecciona rango en DatePicker
- DatePicker ya clampó `end` a yesterday (NO re-clampar)
- Si `isGranularityLocked=false`: recalcular granularidad automáticamente
- Si `isGranularityLocked=true`: mantener granularidad del usuario

### 2.3 Métodos Clave

```typescript
// Obtener período actual en formato ISO
getCurrentPeriod(): { start: string; end: string }

// Calcular período anterior (ventana contigua)
getPreviousPeriod(): { start: string; end: string }

// Obtener granularidad efectiva
getCalculatedGranularity(): Granularity

// Obtener duración en días
getDurationDays(): number
```

### 2.4 Política de Granularidad Lock

**Lock activado (`isGranularityLocked=true`):**

- Usuario seleccionó granularidad manualmente → respetar su elección
- NO recalcular automáticamente al cambiar rango

**Lock desactivado (`isGranularityLocked=false`):**

- Calcular granularidad automáticamente según duración:
  - 1-6 días: `"d"`
  - 7-28 días: `"w"`
  - 29-364 días: `"m"`
  - 365+ días: `"y"`

---

## 3. NIVEL 0: DELTA CARDS (GRID COLAPSADO)

**Componente:** `AnalyticsByTownSectionInner`

### 3.1 Obtención de Datos

```typescript
// 1. Obtener períodos del context
const currentPeriod = getCurrentPeriod(); // { start: "2025-09-26", end: "2025-10-25" }
const calculatedGranularity = getCalculatedGranularity(); // "m"

// 2. Fetch totales para todas las pueblos
const { state, ids, itemsById } = usePueblosTotals(calculatedGranularity, {
  startISO: currentPeriod.start,
  endISO: currentPeriod.end,
});
```

### 3.2 Hook: usePueblosTotals

**Archivo:** `src/features/analytics/hooks/pueblos/usePueblosTotals.ts`

**Parámetros:**

```typescript
{
  granularity: "m",
  startISO: "2025-09-26",
  endISO: "2025-10-25"
}
```

**Endpoint:**

```
GET /api/analytics/v1/dimensions/pueblos/totales?granularity=m&startDate=2025-09-26&endDate=2025-10-25
```

**Respuesta:**

```json
{
  "data": {
    "items": [
      {
        "id": "almonte",
        "title": "Almonte",
        "total": 12500,
        "previousTotal": 10000,
        "deltaPct": 25.0
      },
      ...
    ]
  }
}
```

### 3.3 Renderizado de Cards

```typescript
<SectorsGrid>
  {orderedIds.map((id) => (
    <DeltaCard
      title="Almonte"
      deltaPct={25.0}
      onClick={() => handleOpen(id)}
      loading={isInitialLoading}
    />
  ))}
</SectorsGrid>
```

### 3.4 Click en Card

```typescript
const handleOpen = useCallback((id: string) => {
  setExpandedId(id);
  setDrill({ kind: "town", townId: id as TownId });
}, []);
```

**Resultado:** Grid remonta, card se expande a NIVEL 1

---

## 4. NIVEL 1: PUEBLO EXPANDIDO

**Componente:** `SectorExpandedCardDetailed`

### 4.1 Obtención de Datos

```typescript
// En AnalyticsByTownSectionInner:
const { series: seriesTown, donutData: donutTown } = useTownDetails(
  drill.townId, // "almonte"
  calculatedGranularity // "m"
);
```

### 4.2 Hook: useTownDetails

**Archivo:** `src/features/home/hooks/useTownDetails.ts` (legacy compatibility)

**Proceso:**

1. Obtiene `mode`, `startDate`, `endDate` del context
2. Calcula rangos usando `computeRangesForSeries`:
   ```typescript
   const ranges =
     mode === "range"
       ? computeRangesForSeries(
           granularity,
           startDate.toISOString().split("T")[0],
           endDate.toISOString().split("T")[0]
         )
       : computeRangesForSeries(granularity); // Preset
   ```
3. Llama a `usePuebloDetails` con rangos calculados

### 4.3 Cálculo de Rangos: computeRangesForSeries

**Archivo:** `src/lib/utils/time/timeWindows.ts`

**Reglas:**

- **Granularidad "d"**: 7 días (para gráfica útil)
- **Otras granularidades**: Duración estándar (w=7, m=30, y=365)
- **Previous**: Ventana contigua del mismo tamaño (termina 1 día antes de current.start)

**Ejemplo para granularidad "m":**

```typescript
// Input: granularity="m", sin custom range
// Output:
{
  current: { start: "2025-09-26", end: "2025-10-25" }, // 30 días
  previous: { start: "2025-08-27", end: "2025-09-25" } // 30 días contiguo
}
```

### 4.4 Endpoint: /pueblos/details/[id]

**URL:**

```
GET /api/analytics/v1/dimensions/pueblos/details/almonte?granularity=m&startDate=2025-09-26&endDate=2025-10-25
```

**Backend Process:**

1. Valida pueblo
2. Usa `calculatePreviousPeriodOnly(startDate, endDate)` para calcular rangos
3. Consulta GA4 con `buildPageViewUnionRequest`
4. Procesa filas con `mapDataByGranularity` (genera 30 puntos para "m")
5. Genera donut de categorías con `buildCategoriesDonutForTown`

**Respuesta:**

```json
{
  "granularity": "m",
  "range": {
    "current": { "start": "2025-09-26", "end": "2025-10-25" },
    "previous": { "start": "2025-08-27", "end": "2025-09-25" }
  },
  "id": "almonte",
  "title": "Almonte",
  "series": {
    "current": [
      { "label": "2025-09-26", "value": 450 },
      { "label": "2025-09-27", "value": 480 },
      ... // 30 puntos
    ],
    "previous": [...]
  },
  "donutData": [
    { "label": "Playas", "value": 5000 },
    { "label": "Naturaleza", "value": 3500 },
    { "label": "Cultura", "value": 2000 }
  ],
  "deltaPct": 18.5
}
```

### 4.5 Renderizado Nivel 1

```typescript
<SectorExpandedCardDetailed
  title="Almonte"
  deltaPct={18.5}
  current={series.current} // 30 puntos
  previous={series.previous} // 30 puntos
  donutData={donutTown} // 3 categorías
  onSliceClick={handleSliceClick}
  granularity="m"
>
  <ChartPair
    mode="line"
    series={{ current, previous }}
    donutData={donutData}
    onDonutSlice={handleDonutTopClick}
  />
</SectorExpandedCardDetailed>
```

**Gráfica:** Serie temporal de 30 puntos + donut de 3 categorías ✅ **FUNCIONA CORRECTAMENTE**

### 4.6 Click en Donut (Categoría)

```typescript
const handleSliceClick = useCallback(
  (label: string) => {
    // label = "Playas"
    const categoryId = labelToCategoryId(label); // "playas"

    if (categoryId && expandedId) {
      const newDrill = {
        kind: "town+cat" as const,
        townId: expandedId as TownId, // "almonte"
        categoryId, // "playas"
      };
      setDrill(newDrill);
    }
  },
  [expandedId]
);
```

**Resultado:** Component remonta, aparece NIVEL 2

---

## 5. NIVEL 2: DRILLDOWN PUEBLO+CATEGORÍA

**Componente:** `TownCategoryDrilldownPanel`

### 5.1 Construcción de level2Data

```typescript
// En AnalyticsByTownSectionInner:
const level2Data = useMemo(() => {
  if (!drill || drill.kind !== "town+cat") return undefined;

  // ✅ Calcular rangos usando computeRangesForKPI
  const ranges =
    mode === "range"
      ? computeRangesForKPI(
          calculatedGranularity,
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0]
        )
      : computeRangesForKPI(calculatedGranularity);

  return {
    townId: drill.townId, // "almonte"
    categoryId: drill.categoryId, // "playas"
    granularity: calculatedGranularity, // "m"
    startISO: ranges.current.start, // "2025-09-26"
    endISO: ranges.current.end, // "2025-10-25"
  };
}, [drill, calculatedGranularity, mode, startDate, endDate]);
```

**⚠️ NOTA:** Se usa `computeRangesForKPI` (NO `computeRangesForSeries`) porque es drilldown de datos agregados

### 5.2 Propagación a TownCategoryDrilldownPanel

```typescript
<SectorExpandedCardDetailed level2={level2Data}>
  {level2 && (
    <TownCategoryDrilldownPanel
      townId={level2.townId}
      categoryId={level2.categoryId}
      granularity={level2.granularity}
      startISO={level2.startISO} // ✅ Pasado correctamente
      endISO={level2.endISO} // ✅ Pasado correctamente
    />
  )}
</SectorExpandedCardDetailed>
```

### 5.3 Hooks en TownCategoryDrilldownPanel

#### 5.3.1 Hook: useDrilldownDetails

**Archivo:** `src/features/analytics/hooks/useDrilldownDetails.ts`

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

**⚠️ PROBLEMA ARQUITECTÓNICO:**

- Este endpoint fue diseñado para NIVEL 1 (expansión de pueblo)
- Con `categoryId` filter, filtra filas pero retorna **serie agregada**
- NO retorna series individuales por URL

**Respuesta:**

```json
{
  "series": {
    "current": [
      { "label": "2025-09-26", "value": 150 }, // AGREGADO de todas las URLs
      { "label": "2025-09-27", "value": 160 },
      ... // 30 puntos AGREGADOS
    ],
    "previous": [...]
  },
  "donutData": [
    { "label": "https://example.com/almonte/playa-doñana", "value": 800 },
    { "label": "https://example.com/almonte/playa-matalascañas", "value": 600 },
    { "label": "https://example.com/almonte/playa-cuesta-maneli", "value": 400 }
  ],
  "deltaPct": 12.5
}
```

**Resultado del hook:**

```typescript
{
  loading: false,
  response: {...},
  donut: [
    { label: "https://example.com/almonte/playa-doñana", value: 800 },
    { label: "https://example.com/almonte/playa-matalascañas", value: 600 },
    { label: "https://example.com/almonte/playa-cuesta-maneli", value: 400 }
  ],
  deltaPct: 12.5
}
```

#### 5.3.2 Hook: useUrlSeries

**Archivo:** `src/features/analytics/hooks/useUrlSeries.ts`

**Propósito:** Obtener series individuales para cada URL del donut

**Parámetros:**

```typescript
const urlsToFetch = useMemo(() => {
  if (drilldown.loading) return [];
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

// urls = [
//   "https://example.com/almonte/playa-doñana",
//   "https://example.com/almonte/playa-matalascañas",
//   "https://example.com/almonte/playa-cuesta-maneli"
// ]

const urlSeries = useUrlSeries({
  urls: urlsToFetch,
  granularity: "m",
  startISO: "2025-09-26",
  endISO: "2025-10-25",
});
```

**Proceso:**

1. Verifica caché de React Query
2. Para cada URL no cacheada:

   ```typescript
   const params = new URLSearchParams();
   params.set("path", url);
   params.set("granularity", "m");
   params.set("startDate", "2025-09-26");
   params.set("endDate", "2025-10-25");

   const fullUrl = `/api/analytics/v1/drilldown/url?${params.toString()}`;
   console.log("📊 URL SERIES REQUEST:", fullUrl);

   return fetchJSON<UrlDrilldownResponse>(fullUrl);
   ```

3. Ejecuta queries en paralelo con `useQueries`
4. Combina resultados

**⚠️ CRÍTICO:** Verificar si aparece el log "📊 URL SERIES REQUEST"

- **SI:** Hook ejecuta queries → problema en el endpoint
- **NO:** Hook NO ejecuta → problema en condiciones del hook

**Respuesta esperada (por URL):**

```json
{
  "granularity": "m",
  "xLabels": ["2025-09-26", "2025-09-27", ..., "2025-10-25"], // 30 labels
  "seriesAvgEngagement": {
    "current": [
      { "label": "2025-09-26", "value": 45 },
      { "label": "2025-09-27", "value": 48 },
      ... // 30 puntos
    ],
    "previous": [...]
  },
  "kpis": {...},
  "operatingSystems": [...],
  "devices": [...],
  "countries": [...],
  "deltaPct": 8.5
}
```

**Resultado del hook:**

```typescript
{
  loading: false,
  seriesByUrl: [
    {
      name: "playa-doñana",
      data: [45, 48, 50, ..., 52], // 30 valores
      path: "https://example.com/almonte/playa-doñana"
    },
    {
      name: "playa-matalascañas",
      data: [35, 38, 40, ..., 42], // 30 valores
      path: "https://example.com/almonte/playa-matalascañas"
    },
    {
      name: "playa-cuesta-maneli",
      data: [25, 28, 30, ..., 32], // 30 valores
      path: "https://example.com/almonte/playa-cuesta-maneli"
    }
  ],
  xLabels: ["2025-09-26", "2025-09-27", ..., "2025-10-25"] // 30 labels
}
```

#### 5.3.3 Hook: useDrilldownTransformation

**Archivo:** `src/features/analytics/hooks/useDrilldownTransformation.ts`

**Propósito:** Combinar datos de `drilldown` + `urlSeries`

**Proceso:**

```typescript
const dd = useDrilldownTransformation(drilldown, urlSeries);

// 1. Si cualquiera está loading → return loading
if (drilldown.loading || urlSeries.loading) {
  return { loading: true, ... };
}

// 2. Si urlSeries está vacío → return vacío
if (urlSeries.seriesByUrl.length === 0) {
  return { loading: false, seriesByUrl: [], ... };
}

// 3. Mapear donut items a series reales
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

// 4. Generar colores por ranking
const colors = generateBrandGradient(sortedItems.length);

// 5. Retornar datos combinados
return {
  loading: false,
  xLabels: urlSeries.xLabels,
  seriesByUrl,
  donut,
  deltaPct: drilldown.deltaPct,
  colorsByName
};
```

**⚠️ DEPENDENCIA CRÍTICA:**

- Este hook **SOLO usa datos de `urlSeries`** para las series
- NO usa `drilldown.series` (que está agregada)
- Si `urlSeries` está vacío o con 1 punto → resultado tendrá 1 punto

### 5.4 Renderizado Nivel 2

```typescript
<ChartPair
  mode="multi"
  xLabels={dd.xLabels} // ["2025-09-26", ..., "2025-10-25"]
  seriesBySub={dd.seriesByUrl} // 3 series de 30 puntos cada una
  loading={dd.loading}
  donutData={dd.donut} // 3 URLs
  deltaPct={dd.deltaPct}
  onDonutSlice={handleDonutSliceClick}
  colorsByName={dd.colorsByName}
  granularity="m"
/>
```

**Expectativa:** Gráfica comparativa de 3 URLs con 30 puntos cada una
**Realidad:** ❌ Solo 1 punto de datos

---

## 6. NIVEL 3: URL INDIVIDUAL

**Componente:** `UrlDetailsPanel`

### 6.1 Hook: useUrlDrilldown

**Archivo:** `src/features/analytics/hooks/useUrlDrilldown.ts`

**Trigger:** Click en slice del donut de nivel 2

**Parámetros:**

```typescript
{
  path: "https://example.com/almonte/playa-doñana",
  granularity: "m",
  startISO: "2025-09-26",
  endISO: "2025-10-25"
}
```

**Endpoint:**

```
GET /api/analytics/v1/drilldown/url?path=https://example.com/almonte/playa-doñana&granularity=m&startDate=2025-09-26&endDate=2025-10-25
```

**Respuesta:** Misma que useUrlSeries (métricas detalladas de URL)

### 6.2 Renderizado Nivel 3

```typescript
<UrlDetailsPanel
  path="https://example.com/almonte/playa-doñana"
  granularity="m"
  startISO="2025-09-26"
  endISO="2025-10-25"
  kpis={url.kpis}
  seriesAvgEngagement={url.seriesAvgEngagement}
  operatingSystems={url.operatingSystems}
  devices={url.devices}
  countries={url.countries}
  deltaPct={url.deltaPct}
/>
```

---

## 7. BACKEND ENDPOINTS

### 7.1 Endpoint: /pueblos/totales

**Ruta:** `src/app/api/analytics/v1/dimensions/pueblos/totales/route.ts`

**Propósito:** Totales agregados de todos los pueblos (para delta cards)

**Proceso:**

1. Recibe: `granularity`, `startDate`, `endDate`
2. Usa `calculatePreviousPeriodOnly` para calcular `prevRange`
3. Consulta GA4 para rangos `current` y `previous`
4. Agrega por pueblo
5. Calcula delta %

**Retorna:**

```json
{
  "data": {
    "items": [
      { "id": "almonte", "total": 12500, "previousTotal": 10000, "deltaPct": 25.0 },
      ...
    ]
  }
}
```

### 7.2 Endpoint: /pueblos/details/[id]

**Ruta:** `src/app/api/analytics/v1/dimensions/pueblos/details/[id]/route.ts`

**Propósito:** Series temporal + donut para un pueblo específico

**Proceso:**

1. Recibe: `id` (pueblo), `granularity`, `startDate`, `endDate`, `categoryId` (opcional)
2. Valida pueblo
3. Usa `calculatePreviousPeriodOnly` para rangos
4. Consulta GA4 con `buildPageViewUnionRequest`
5. **Si hay `categoryId`**: Pre-filtra filas por categoría
6. Procesa con `mapDataByGranularity`:
   - Genera vectores de valores por slot temporal
   - Para granularidad "m": 30 slots (1 por día)
   - **AGREGA** todas las filas que coinciden con pueblo (y categoría si aplica)
7. Genera donut:
   - Sin `categoryId`: Categorías del pueblo
   - Con `categoryId`: URLs de la categoría

**⚠️ PROBLEMA:**
Cuando hay `categoryId`, el filtro funciona pero `mapDataByGranularity` **AGREGA** todas las URLs filtradas en una sola serie. NO genera series separadas por URL.

**Retorna:**

```json
{
  "granularity": "m",
  "range": { "current": {...}, "previous": {...} },
  "id": "almonte",
  "title": "Almonte",
  "series": {
    "current": [...], // 30 puntos AGREGADOS
    "previous": [...]
  },
  "donutData": [
    { "label": "url1", "value": 800 },
    { "label": "url2", "value": 600 },
    { "label": "url3", "value": 400 }
  ],
  "deltaPct": 12.5
}
```

### 7.3 Endpoint: /drilldown/url

**Ruta:** `src/app/api/analytics/v1/drilldown/url/route.ts`

**Propósito:** Serie temporal + métricas detalladas para una URL específica

**Proceso:**

1. Recibe: `path` (URL completa), `granularity`, `startDate`, `endDate`
2. **Construye axis:**

   ```typescript
   if (startISOParam) {
     // ❌ PROBLEMA: Solo crea 1 label
     axis = {
       dimensionTime: ga4Granularity === "y" ? "yearMonth" : "date",
       queryRange: customRange,
       curRange: customRange,
       prevRange: { start: startISOParam, end: endISO },
       xLabels: [customRange.start], // ⚠️ SOLO 1 LABEL
       curKeys: [customRange.start.replace(/-/g, "")], // ⚠️ SOLO 1 KEY
       curIndexByKey: new Map([[customRange.start.replace(/-/g, ""), 0]]),
       prevIndexByKey: new Map(),
     };
   } else {
     // ✅ Correcto: usa buildLaggedAxisForGranularity
     axis = buildLaggedAxisForGranularity(g, { endISO });
   }
   ```

3. Consulta GA4 con filtros:

   ```typescript
   const seriesFilters = [
     { filter: { fieldName: "eventName", value: "page_view" } },
     { filter: { fieldName: "pageLocation", value: targetUrl } }, // URL exacta
   ];
   ```

4. Procesa filas y llena vectores `currEng[]`, `currViews[]` por bucket
5. Calcula series de engagement promedio
6. Fetch KPIs totales con `fetchUrlTotalsAggregated`
7. Genera donuts (operatingSystem, device, country)

**🔴 PROBLEMA IDENTIFICADO:**
Cuando viene `startISOParam`, solo crea **1 label** en vez de generar el array completo según la granularidad:

- Granularidad "d" → debería tener 7 labels
- Granularidad "w" → debería tener 7 labels
- Granularidad "m" → debería tener 30 labels
- Granularidad "y" → debería tener 12 labels (meses)

Esto causa que:

- Solo haya 1 bucket en el eje X
- Solo se mapee 1 punto de datos
- El gráfico muestre solo 1 punto

**Retorna:**

```json
{
  "granularity": "m",
  "xLabels": ["2025-09-26"], // ❌ SOLO 1 LABEL (debería ser 30)
  "seriesAvgEngagement": {
    "current": [
      { "label": "2025-09-26", "value": 45 } // ❌ SOLO 1 PUNTO
    ],
    "previous": []
  },
  "kpis": {...},
  "operatingSystems": [...],
  "devices": [...],
  "countries": [...],
  "deltaPct": 8.5
}
```

---

## 8. COMPORTAMIENTO DE GRANULARIDAD

### 8.1 Granularidad para KPIs/Deltas

**Función:** `computeRangesForKPI`

**Reglas:**

- **"d"**: 1 día (ayer vs anteayer)
- **"w"**: 7 días
- **"m"**: 30 días
- **"y"**: 365 días

**Previous:** Ventana contigua del mismo tamaño (sin shifts especiales)

### 8.2 Granularidad para Series/Gráficos

**Función:** `computeRangesForSeries`

**Reglas:**

- **"d"**: 7 días (para gráfica útil, no 1 día)
- **"w"**: 7 días
- **"m"**: 30 días
- **"y"**: 365 días

**Previous:** Ventana contigua del mismo tamaño

### 8.3 Dimensión de Tiempo GA4

**Función:** `determineGA4Granularity`

**Reglas:**

- **"y"**: `"yearMonth"` (YYYYMM)
- **Otras**: `"date"` (YYYYMMDD)

### 8.4 Ejemplo Completo: Granularidad "m"

#### Nivel 0 (Delta Cards)

```typescript
// computeRangesForKPI("m")
current:  { start: "2025-09-26", end: "2025-10-25" } // 30 días
previous: { start: "2025-08-27", end: "2025-09-25" } // 30 días
```

#### Nivel 1 (Pueblo)

```typescript
// computeRangesForSeries("m")
current:  { start: "2025-09-26", end: "2025-10-25" } // 30 días
previous: { start: "2025-08-27", end: "2025-09-25" } // 30 días
// Series: 30 puntos (1 por día)
```

#### Nivel 2 (Drilldown)

```typescript
// computeRangesForKPI("m") - usado en level2Data
current:  { start: "2025-09-26", end: "2025-10-25" } // 30 días
previous: { start: "2025-08-27", end: "2025-09-25" } // 30 días
// Debería tener: 30 puntos por URL
// Tiene: ❌ 1 punto por URL
```

---

## 9. DIAGNÓSTICO DEL PROBLEMA

### 9.1 Síntomas

1. **Nivel 1 (pueblo expandido)**: ✅ Funciona correctamente (30 puntos)
2. **Nivel 2 (drilldown pueblo+categoría)**: ❌ Solo 1 punto en todas las granularidades
3. **Nivel 3 (URL individual)**: ❌ Probablemente 1 punto también

### 9.2 Verificación Paso a Paso

#### Paso 1: ¿Se construye level2Data correctamente?

```typescript
// En AnalyticsByTownSectionInner:
console.log("level2Data:", level2Data);
// Esperar:
// {
//   townId: "almonte",
//   categoryId: "playas",
//   granularity: "m",
//   startISO: "2025-09-26",
//   endISO: "2025-10-25"
// }
```

**✅ VERIFICADO:** level2Data se construye correctamente

#### Paso 2: ¿Se pasa startISO a TownCategoryDrilldownPanel?

```typescript
// En SectorExpandedCardDetailed:
console.log("level2 props:", level2);
// Esperar: mismo objeto que level2Data
```

**✅ VERIFICADO:** Props se pasan correctamente

#### Paso 3: ¿useDrilldownDetails recibe startISO?

```typescript
// En TownCategoryDrilldownPanel:
const drilldown = useDrilldownDetails({
  type: "pueblo-category",
  townId,
  categoryId,
  granularity,
  startISO, // ¿Está definido?
  endISO,
});

console.log("🌐 DRILLDOWN URL (NIVEL 2):", url);
// Esperar URL con startDate + endDate
```

**✅ VERIFICADO:** URL se construye con ambos parámetros

#### Paso 4: ¿El endpoint /pueblos/details/[id] retorna 30 puntos?

**RESPUESTA:** SÍ, retorna 30 puntos pero son **AGREGADOS** (no por URL)

#### Paso 5: ¿urlsToFetch tiene las URLs correctas?

```typescript
// En TownCategoryDrilldownPanel:
const urlsToFetch = useMemo(() => {
  if (drilldown.loading) return [];
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

**❓ PENDIENTE:** Verificar output de este log

#### Paso 6: ¿useUrlSeries ejecuta queries?

```typescript
// En useUrlSeries.ts:
console.log("📊 URL SERIES REQUEST:", fullUrl);
```

**❓ PENDIENTE:** Verificar si aparece este log

### 9.3 Hipótesis Principales

#### Hipótesis A: useUrlSeries NO se ejecuta

**Causas posibles:**

1. `urls` array está vacío
2. `drilldown.loading` se queda en `true`
3. Condición `enabled` en useQueries es `false`
4. React re-renders infinitos previenen ejecución

**Evidencia requerida:**

- Log "🔍 URLs to fetch" debe mostrar array con 3 URLs
- Log "📊 URL SERIES REQUEST" NO aparece

**Solución:**

- Revisar condiciones del useMemo
- Verificar dependencias del useQueries

#### Hipótesis B: useUrlSeries ejecuta pero endpoint retorna 1 punto

**Causas posibles:**

1. Endpoint `/drilldown/url` tiene bug en construcción de `axis`
2. Cuando viene `startISOParam`, solo crea 1 label
3. Vector `currEng[]` y `currViews[]` solo tienen 1 elemento

**Evidencia requerida:**

- Log "📊 URL SERIES REQUEST" aparece (3 veces para 3 URLs)
- Respuesta del endpoint tiene `xLabels` con 1 elemento
- Respuesta tiene `seriesAvgEngagement.current` con 1 punto

**Solución:**

- Arreglar construcción de `axis` en `/drilldown/url/route.ts`
- Generar `xLabels` completo basado en granularidad

---

## 10. SOLUCIÓN PROPUESTA

### 10.1 Si useUrlSeries NO se ejecuta

**Archivo:** `src/features/analytics/sectors/expanded/SectorExpandedCardDetailed/TownCategoryDrilldownPanel.tsx`

**Verificar:**

```typescript
const urlsToFetch = useMemo(() => {
  console.log("🔍 DEBUG urlsToFetch:", {
    drilldownLoading: drilldown.loading,
    donutLength: drilldown.donut?.length,
    startISO,
    endISO,
  });

  if (drilldown.loading) {
    console.log("⚠️ Drilldown still loading, returning empty array");
    return [];
  }

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

**Posibles fixes:**

1. Agregar condición de timeout para `drilldown.loading`
2. Verificar que `drilldown.donut` no sea undefined
3. Forzar re-render cuando `drilldown` cambia de loading a ready

### 10.2 Si useUrlSeries ejecuta pero retorna 1 punto

**Archivo:** `src/app/api/analytics/v1/drilldown/url/route.ts`

**Problema identificado (línea ~180-200):**

```typescript
if (startISOParam) {
  // ❌ INCORRECTO: Solo crea 1 label
  axis = {
    dimensionTime: ga4Granularity === "y" ? "yearMonth" : "date",
    queryRange: customRange,
    curRange: customRange,
    prevRange: { start: startISOParam, end: endISO },
    xLabels: [customRange.start], // ⚠️ PROBLEMA AQUÍ
    curKeys: [customRange.start.replace(/-/g, "")],
    curIndexByKey: new Map([[customRange.start.replace(/-/g, ""), 0]]),
    prevIndexByKey: new Map(),
  };
}
```

**Solución:**

```typescript
if (startISOParam) {
  // ✅ CORRECTO: Usar buildLaggedAxisForGranularity incluso con startISOParam
  // O implementar función custom para generar labels según granularidad

  // Opción 1: Usar buildLaggedAxisForGranularity
  axis = buildLaggedAxisForGranularity(g, {
    endISO,
    startISO: startISOParam, // Si la función lo soporta
  });

  // Opción 2: Generar labels manualmente
  const labels = generateLabelsForRange(startISOParam, endISO, g);
  const ga4Granularity = determineGA4Granularity(g);

  axis = {
    dimensionTime: ga4Granularity === "y" ? "yearMonth" : "date",
    queryRange: { start: startISOParam, end: endISO },
    curRange: { start: startISOParam, end: endISO },
    prevRange: calculatePreviousRange({ start: startISOParam, end: endISO }),
    xLabels: labels, // Array completo
    curKeys: labels.map((label) => label.replace(/-/g, "")),
    curIndexByKey: new Map(
      labels.map((label, idx) => [label.replace(/-/g, ""), idx])
    ),
    prevIndexByKey: new Map(), // Calcular si es necesario
  };
}
```

**Función helper necesaria:**

```typescript
function generateLabelsForRange(
  startISO: string,
  endISO: string,
  granularity: Granularity
): string[] {
  const labels: string[] = [];
  const start = parseISO(startISO);
  const end = parseISO(endISO);

  if (granularity === "y") {
    // Generar labels por mes (YYYY-MM)
    let current = start;
    while (current <= end) {
      const year = current.getUTCFullYear();
      const month = String(current.getUTCMonth() + 1).padStart(2, "0");
      labels.push(`${year}-${month}`);
      current = new Date(Date.UTC(year, current.getUTCMonth() + 1, 1));
    }
  } else {
    // Generar labels por día (YYYY-MM-DD)
    let current = start;
    while (current <= end) {
      labels.push(toISO(current));
      current = addDaysUTC(current, 1);
    }
  }

  return labels;
}
```

### 10.3 Testing de la Solución

**Comandos de prueba:**

```bash
# 1. Test endpoint directamente
curl "http://localhost:3000/api/analytics/v1/drilldown/url?path=https://example.com/almonte/playa-doñana&granularity=m&startDate=2025-09-26&endDate=2025-10-25" | jq '.xLabels | length'

# Esperar: 30 (no 1)

# 2. Test endpoint con granularidad "d"
curl "http://localhost:3000/api/analytics/v1/drilldown/url?path=https://example.com/almonte/playa-doñana&granularity=d&startDate=2025-10-19&endDate=2025-10-25" | jq '.xLabels | length'

# Esperar: 7 (no 1)

# 3. Test endpoint con granularidad "y"
curl "http://localhost:3000/api/analytics/v1/drilldown/url?path=https://example.com/almonte/playa-doñana&granularity=y&startDate=2024-01-01&endDate=2024-12-31" | jq '.xLabels | length'

# Esperar: 12 (no 1)
```

---

## ACCIONES INMEDIATAS REQUERIDAS

### Paso 1: Recargar aplicación y proveer logs

**Usuario debe:**

1. Abrir consola del navegador
2. Ir a Analytics → Pueblos
3. Seleccionar granularidad "Mes"
4. Click en card "Almonte"
5. Click en slice "Playas" del donut
6. **Copiar todos los logs** que aparezcan:
   - "🌐 DRILLDOWN URL (NIVEL 2): ..."
   - "🔍 URLs to fetch: ..."
   - "📊 URL SERIES REQUEST: ..." (si aparece)
   - Cualquier error en rojo

### Paso 2: Análisis de logs

**Con los logs podremos confirmar:**

- Si `urlsToFetch` tiene las 3 URLs correctas
- Si `useUrlSeries` está ejecutando queries
- Si hay errores de red o de parsing

### Paso 3: Aplicar fix correspondiente

**Escenario A:** Si NO aparece "📊 URL SERIES REQUEST"
→ Fix en `TownCategoryDrilldownPanel` o `useUrlSeries`

**Escenario B:** Si aparece "📊 URL SERIES REQUEST" (3 veces)
→ Fix en `/drilldown/url/route.ts` (construcción de axis)

---

## RESUMEN EJECUTIVO

### Estado Actual

- ✅ Nivel 0 (Delta Cards): Funciona
- ✅ Nivel 1 (Pueblo Expandido): Funciona (30 puntos)
- ❌ Nivel 2 (Drilldown): Solo 1 punto (debería 30)
- ❌ Nivel 3 (URL Individual): Probablemente 1 punto

### Root Cause Probable

Endpoint `/drilldown/url` tiene bug en construcción de `axis` cuando recibe `startDate` + `endDate`:

- Solo crea 1 label en `xLabels` array
- Solo crea 1 key en mapas de indexación
- Resultado: Solo 1 bucket temporal → Solo 1 punto de datos

### Impacto

- Todas las granularidades afectadas (d, w, m, y)
- Afecta drilldown nivel 2 y nivel 3
- Usuario no puede ver evolución temporal de URLs individuales

### Fix Estimado

- **Complejidad:** Media
- **Archivos afectados:** 1 (`/drilldown/url/route.ts`)
- **Líneas:** ~30
- **Testing:** Requerido para todas las granularidades

### Próximo Paso

**ESPERANDO LOGS DEL USUARIO PARA CONFIRMAR HIPÓTESIS**

---

**FIN DEL REPORTE**
