# ANÁLISIS DE IMPLEMENTACIÓN: Analytics Drilldown Completo

**Fecha:** 26 de octubre de 2025
**Objetivo:** Analizar qué está implementado y qué falta para cumplir con los requisitos del prompt

---

## RESUMEN EJECUTIVO

### ✅ Lo que YA FUNCIONA:

1. **Context y Providers**: UnifiedTimeContext con TownTimeProvider/TagTimeProvider funcionando
2. **Nivel 0**: Delta Cards con usePueblosTotals/useCategoriasTotals
3. **Nivel 1**: Parcialmente - Serie temporal funciona, donut funciona
4. **Backend**: Endpoints base existen pero tienen el bug del axis

### ❌ Lo que FALTA o NECESITA FIX:

1. **Nivel 1**: Ajustar comportamiento de granularidad "d" → GroupedBarSide
2. **Nivel 2**: Donut de URLs current-only, gráfico top-5, sin useUrlSeries masivo
3. **Nivel 3**: Implementar correctamente con donuts secundarios
4. **Backend**: FIX CRÍTICO en /drilldown/url para xLabels completos
5. **Normalización**: URLs y matching con taxonomía
6. **ChartPair**: Ajustes para modos grouped bar

---

## 1. PROVIDERS Y HEADER ✅ COMPLETO

### Estado Actual:

```typescript
// src/features/analytics/context/UnifiedTimeContext.tsx
- ✅ TownTimeProvider y TagTimeProvider separados
- ✅ isGranularityLocked implementado
- ✅ getCurrentPeriod(), getPreviousPeriod(), getCalculatedGranularity()
- ✅ Modo "d" retorna 1 día (ayer) y previous = anteayer
```

### Falta:

- ❓ **isReady**: Opcional, pero útil para evitar renders con datos incompletos
  ```typescript
  // Agregar al context:
  isReady: boolean; // true si startDate y endDate son válidos
  ```

### Recomendación:

**NO CAMBIAR** - El context está bien diseñado. Solo agregar `isReady` si hay problemas de renders prematuros.

---

## 2. NIVEL 0 — DELTA CARDS ✅ FUNCIONA

### Estado Actual:

```typescript
// AnalyticsByTownSection:
- ✅ usePueblosTotals con deltaPct
- ✅ deltaPct = null cuando previousTotal <= 0
- ✅ Orden por interacciones (TOWN_ID_ORDER)
- ✅ Métrica: page_views

// AnalyticsByTagSection:
- ✅ Equivalente para categorías
```

### Falta:

- ❌ **Verificar UI** para deltaPct = null → "Sin datos suficientes"
  - Actualmente: DeltaCard renderiza deltaPct o vacío
  - Requerido: Mostrar mensaje explícito cuando deltaPct === null

### Recomendación:

```typescript
// src/components/common/DeltaCard.tsx
{deltaPct === null ? (
  <span className="text-sm text-gray-500">Sin datos suficientes</span>
) : (
  <span className={...}>{formatDelta(deltaPct)}</span>
)}
```

---

## 3. NIVEL 1 — PRIMER DRILLDOWN ⚠️ NECESITA AJUSTES

### Estado Actual:

#### Serie Temporal:

```typescript
// ChartPair.tsx - LineSide:
- ✅ granularity === "d" → ComparisonBarChart (2 barras)
- ✅ granularity !== "d" → ChartSection (línea)
- ✅ xLabels completos
- ✅ current vs previous
```

**PROBLEMA**: ComparisonBarChart usa toda la serie, debería usar SOLO 1 fecha

#### Donut:

```typescript
// useTownDetails / useCategoryDetails:
- ✅ Retorna donutData
- ❓ ¿Es current-only o incluye previous?
```

**REQUERIDO**: Verificar que donut sea current-only

### Cambios Necesarios:

#### 3.1 ChartPair - LineSide para granularidad "d"

**Archivo:** `src/components/common/ChartPair.tsx`

**Problema Actual:**

```typescript
// LineSide recibe series completa y la pasa a ComparisonBarChart
// ComparisonBarChart espera series con múltiples puntos
```

**Solución:**

```typescript
function LineSide({
  series,
  granularity = "d",
}: {
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  granularity?: Granularity;
}) {
  if (granularity === "d") {
    // ✅ Para "d", usar GroupedBarSide con 1 fecha
    // Tomar SOLO el último punto (ayer)
    const lastCurrent = series.current[series.current.length - 1];
    const lastPrevious = series.previous[series.previous.length - 1];

    if (!lastCurrent || !lastPrevious) {
      return <div>No hay datos</div>;
    }

    const categories = [lastCurrent.label]; // ["2025-10-25"]
    const groupedSeries: GroupedBarSeries[] = [
      { name: "Periodo actual", data: [lastCurrent.value] },
      { name: "Periodo anterior", data: [lastPrevious.value] },
    ];

    return (
      <GroupedBarChart
        title="Comparación diaria"
        subtitle="Ayer vs Anteayer"
        categories={categories}
        series={groupedSeries}
        height={350}
        showLegend={true}
        legendPosition="top"
        tooltipFormatter={(val) => val.toLocaleString()}
        yAxisFormatter={(val) => val.toString()}
      />
    );
  }

  // Para w/m/y: línea normal
  // ... código existente
}
```

#### 3.2 Verificar Donut Current-Only

**Archivos a revisar:**

- `src/app/api/analytics/v1/dimensions/pueblos/details/[id]/route.ts`
- `src/app/api/analytics/v1/dimensions/categorias/details/[id]/route.ts`

**Verificación:**

```typescript
// En el endpoint, verificar que donutData use SOLO currentRange:
const donutData = categoryFilter
  ? buildUrlsDonutForTownCategory(
      filteredRows,
      matchTownIdFromPath,
      townId,
      matchCategoryIdFromPath,
      categoryFilter,
      donutRanges.current.start, // ✅ current
      donutRanges.current.end, // ✅ current
      actualGranularity
    )
  : buildCategoriesDonutForTown(
      rows,
      matchTownIdFromPath,
      townId,
      matchCategoryIdFromPath,
      donutRanges.current.start, // ✅ current
      donutRanges.current.end, // ✅ current
      actualGranularity
    );
```

**Si usa previous**: Cambiar a usar solo current.

---

## 4. NIVEL 2 — DRILLDOWN {TOWN + CATEGORY} 🔴 CRÍTICO

### Estado Actual:

```typescript
// TownCategoryDrilldownPanel:
- ❌ Llama useDrilldownDetails → /pueblos/details con categoryId filter
- ❌ Llama useUrlSeries para TODAS las URLs (ineficiente)
- ❌ No hay lógica de top-5
- ❌ Gráfico usa DrilldownMultiLineSection sin distinción de granularidad
```

### Problemas Identificados:

1. **Endpoint incorrecto**: `/pueblos/details` con `categoryId` retorna serie AGREGADA, no por URL
2. **Concurrencia excesiva**: `useUrlSeries` llama a `/drilldown/url` por CADA URL
3. **Sin top-5**: Muestra todas las URLs en el gráfico
4. **Sin grouped bar para "d"**: No hay lógica específica para granularidad diaria

### Solución Requerida:

#### 4.1 Nuevo Endpoint (Opción A - Recomendada):

**Crear:** `/api/analytics/v1/drilldown/pueblo-categoria`

**Propósito:** Retornar datos agregados por URL para un {townId, categoryId}

**Respuesta:**

```typescript
{
  granularity: "m",
  range: { current: {...}, previous: {...} },
  context: { townId: "almonte", categoryId: "playas" },
  urlSeries: [ // ✅ Series pre-calculadas por URL
    {
      url: "https://example.com/almonte/playa-doñana",
      name: "Playa Doñana",
      currentTotal: 800,
      currentSeries: [45, 48, 50, ..., 52], // 30 valores
      previousSeries: [40, 43, 45, ..., 47]  // 30 valores
    },
    ...
  ],
  donutData: [ // current-only
    { label: "https://...", value: 800 },
    ...
  ],
  deltaPct: 12.5
}
```

**Ventajas:**

- 1 sola query en vez de N queries
- Backend optimiza agregación por URL
- Más eficiente

#### 4.2 Refactor de TownCategoryDrilldownPanel (Opción B - Sin nuevo endpoint):

**Mantener endpoint actual pero NO llamar useUrlSeries**

**Archivo:** `src/features/analytics/sectors/expanded/SectorExpandedCardDetailed/TownCategoryDrilldownPanel.tsx`

**Cambios:**

```typescript
export default function TownCategoryDrilldownPanel({
  townId,
  categoryId,
  granularity,
  startISO,
  endISO,
}: Props) {
  // 1. Fetch drilldown (donut de URLs)
  const drilldown = useDrilldownDetails({
    type: "pueblo-category",
    townId,
    categoryId,
    granularity,
    startISO,
    endISO,
  });

  // ❌ NO usar useUrlSeries aquí (demasiadas queries)

  // 2. Para granularidad "d": Usar donut directamente
  if (granularity === "d") {
    // Solo mostrar donut + grouped bar del total por URL (current-only)
    const top5 = drilldown.donut.slice(0, 5);

    return (
      <div>
        <ChartPair
          mode="grouped"
          categories={top5.map((d) => formatUrlForDisplay(d.label))}
          groupedSeries={[
            { name: "Interacciones", data: top5.map((d) => d.value) },
          ]}
          donutData={drilldown.donut}
          deltaPct={drilldown.deltaPct}
          onDonutSlice={handleDonutSliceClick}
          granularity={granularity}
        />
      </div>
    );
  }

  // 3. Para granularity !== "d":
  // Problema: No tenemos series por URL sin llamar a /drilldown/url
  // SOLUCIÓN: Necesitamos nuevo endpoint O aceptar múltiples llamadas

  // Opción 3A: Top-5 con useUrlSeries limitado
  const top5Urls = drilldown.donut.slice(0, 5).map((d) => d.label);

  const urlSeries = useUrlSeries({
    urls: top5Urls, // ✅ Solo top-5
    granularity,
    startISO,
    endISO,
  });

  const dd = useDrilldownTransformation(drilldown, urlSeries);

  return (
    <div>
      <ChartPair
        mode="multi"
        xLabels={dd.xLabels}
        seriesBySub={dd.seriesByUrl} // top-5
        loading={dd.loading}
        donutData={drilldown.donut} // todas las URLs
        deltaPct={drilldown.deltaPct}
        onDonutSlice={handleDonutSliceClick}
        colorsByName={dd.colorsByName}
        granularity={granularity}
      />
    </div>
  );
}
```

#### 4.3 ChartPair - Modo "multi" para granularidad "d"

**Archivo:** `src/components/common/ChartPair.tsx`

**Ya existe lógica**, verificar:

```typescript
// ChartPair.tsx línea ~94
const shouldUseGroupedBar = props.mode === "multi" && props.granularity === "d";

// Y luego:
shouldUseGroupedBar ? (
  <MultiAsGroupedBar
    seriesBySub={props.seriesBySub}
    loading={props.loading}
  />
) : (
  <DrilldownMultiLineSection ... />
)
```

**Problema en MultiAsGroupedBar:**

```typescript
// Toma ÚLTIMO valor de cada serie (correcto)
const values = seriesBySub.map((s) => {
  const lastValue = s.data[s.data.length - 1];
  return lastValue || 0;
});
```

**✅ Esto está CORRECTO** - Solo muestra current en la fecha final

---

## 5. NIVEL 3 — URL INDIVIDUAL ⚠️ NECESITA AJUSTES

### Estado Actual:

```typescript
// UrlDetailsPanel:
- ✅ Recibe path, granularity, startISO, endISO
- ✅ useUrlDrilldown → /drilldown/url
- ❓ Renderiza series + KPIs + donuts
```

### Problemas:

1. **Gráfico para "d"**: ¿Usa GroupedBarSide?
2. **Donuts secundarios**: ¿Son current-only?

### Cambios Necesarios:

**Archivo:** `src/features/analytics/sectors/expanded/SectorExpandedCardDetailed/UrlDetailsPanel.tsx`

**Verificar estructura:**

```typescript
export default function UrlDetailsPanel({
  path,
  granularity,
  startISO,
  endISO,
  ...props
}: Props) {
  const url = useUrlDrilldown({ path, granularity, startISO, endISO });

  if (url.loading) return <Skeleton />;

  // ✅ Para granularidad "d": GroupedBarSide
  const chartMode = granularity === "d" ? "grouped" : "line";

  return (
    <div>
      {/* Serie principal */}
      {chartMode === "grouped" ? (
        <GroupedBarChart
          categories={[startISO]} // 1 fecha
          series={[
            { name: "Actual", data: [url.seriesAvgEngagement.current[0]?.value || 0] },
            { name: "Anterior", data: [url.seriesAvgEngagement.previous[0]?.value || 0] }
          ]}
          ...
        />
      ) : (
        <LineChart
          xLabels={url.xLabels} // completos
          series={{ current, previous }}
          ...
        />
      )}

      {/* KPIs */}
      <KPIGrid kpis={url.kpis} />

      {/* Donuts secundarios - VERIFICAR current-only */}
      <DonutGrid
        operatingSystems={url.operatingSystems} // ✅ ya es current
        devices={url.devices}                   // ✅ ya es current
        countries={url.countries}               // ✅ ya es current
      />
    </div>
  );
}
```

**Verificar endpoint** `/drilldown/url` retorna donuts current-only:

```typescript
// En /api/analytics/v1/drilldown/url/route.ts
// Los donuts deben usar donutRange (current-only)
const donutRange =
  g === "d"
    ? { start: axis.curRange.end, end: axis.curRange.end }
    : axis.curRange;
```

---

## 6. FIX CRÍTICO — /api/analytics/v1/drilldown/url 🔴 URGENTE

### Problema Actual:

```typescript
// Cuando recibe startDate/endDate:
if (startISOParam) {
  axis = {
    xLabels: [customRange.start], // ❌ SOLO 1 LABEL
    curKeys: [customRange.start.replace(/-/g, "")],
    ...
  };
}
```

### Solución Completa:

**Archivo:** `src/app/api/analytics/v1/drilldown/url/route.ts`

**Paso 1: Crear helpers tipados**

```typescript
// Agregar al inicio del archivo o en timeAxis.ts

/**
 * Genera array de labels para un rango según granularidad
 */
function generateLabelsForRange(
  startISO: string,
  endISO: string,
  granularity: Granularity
): string[] {
  const labels: string[] = [];
  const start = parseISO(startISO);
  const end = parseISO(endISO);

  if (granularity === "y") {
    // Mensual: YYYY-MM
    let current = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)
    );

    while (current <= end) {
      const year = current.getUTCFullYear();
      const month = String(current.getUTCMonth() + 1).padStart(2, "0");
      labels.push(`${year}-${month}`);
      current = new Date(Date.UTC(year, current.getUTCMonth() + 1, 1));
    }
  } else {
    // Diario: YYYY-MM-DD
    let current = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
    );

    while (current <= end) {
      labels.push(toISO(current));
      current = addDaysUTC(current, 1);
    }
  }

  return labels;
}

/**
 * Calcula rango anterior del mismo tamaño
 */
function calculatePreviousRangeForAxis(current: {
  start: string;
  end: string;
}): { start: string; end: string } {
  const startDate = parseISO(current.start);
  const endDate = parseISO(current.end);

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const duration = diffDays + 1; // inclusivo

  const prevEnd = addDaysUTC(startDate, -1);
  const prevStart = addDaysUTC(prevEnd, -(duration - 1));

  return {
    start: toISO(prevStart),
    end: toISO(prevEnd),
  };
}
```

**Paso 2: Reemplazar lógica del axis**

```typescript
// Línea ~180-200 en route.ts
if (startISOParam) {
  // ✅ CORRECTO: Generar labels completos
  const customRange = { start: startISOParam, end: endISO };
  const ga4Granularity = determineGA4Granularity(g);

  // Generar labels según granularidad
  const xLabels = generateLabelsForRange(startISOParam, endISO, g);

  // Calcular previous range
  const prevRange = calculatePreviousRangeForAxis(customRange);

  // Para granularidad year, convertir labels a keys YYYYMM
  const curKeys =
    ga4Granularity === "y"
      ? xLabels.map((label) => label.replace(/-/g, "")) // "2024-01" → "202401"
      : xLabels.map((label) => label.replace(/-/g, "")); // "2024-01-15" → "20240115"

  // Generar prevKeys del mismo tamaño
  const prevLabels = generateLabelsForRange(prevRange.start, prevRange.end, g);
  const prevKeys =
    ga4Granularity === "y"
      ? prevLabels.map((label) => label.replace(/-/g, ""))
      : prevLabels.map((label) => label.replace(/-/g, ""));

  axis = {
    dimensionTime: ga4Granularity === "y" ? "yearMonth" : "date",
    queryRange: {
      start: prevRange.start,
      end: customRange.end,
    },
    curRange: customRange,
    prevRange: prevRange,
    xLabels: xLabels, // ✅ Array completo
    curKeys: curKeys, // ✅ Array completo
    prevKeys: prevKeys, // ✅ Array completo
    curIndexByKey: new Map(curKeys.map((k, i) => [k, i])),
    prevIndexByKey: new Map(prevKeys.map((k, i) => [k, i])),
  };
} else {
  // Usar función existente
  axis = buildLaggedAxisForGranularity(g, { endISO });

  // Actualizar dimensión de tiempo
  const ga4Granularity = determineGA4Granularity(g);
  axis.dimensionTime = ga4Granularity === "y" ? "yearMonth" : "date";
}
```

**Paso 3: Verificar vectores**

```typescript
// Asegurar que los vectores tengan la longitud correcta
const N = axis.xLabels.length; // ✅ Usar longitud real

const currEng: number[] = Array<number>(N).fill(0);
const prevEng: number[] = Array<number>(N).fill(0);
const currViews: number[] = Array<number>(N).fill(0);
const prevViews: number[] = Array<number>(N).fill(0);
```

**Paso 4: Testing**

```bash
# Test granularidad "m" (30 días)
curl "http://localhost:3000/api/analytics/v1/drilldown/url?path=https://example.com/test&granularity=m&startDate=2025-09-26&endDate=2025-10-25" | jq '.xLabels | length'
# Esperar: 30

# Test granularidad "d" (1 día)
curl "http://localhost:3000/api/analytics/v1/drilldown/url?path=https://example.com/test&granularity=d&startDate=2025-10-25&endDate=2025-10-25" | jq '.xLabels | length'
# Esperar: 1

# Test granularidad "w" (7 días)
curl "http://localhost:3000/api/analytics/v1/drilldown/url?path=https://example.com/test&granularity=w&startDate=2025-10-19&endDate=2025-10-25" | jq '.xLabels | length'
# Esperar: 7

# Test granularidad "y" (12 meses)
curl "http://localhost:3000/api/analytics/v1/drilldown/url?path=https://example.com/test&granularity=y&startDate=2024-01-01&endDate=2024-12-31" | jq '.xLabels | length'
# Esperar: 12
```

---

## 7. NORMALIZACIÓN Y MATCHING DE URLs 📝 PENDIENTE

### Requerido:

1. **Normalización de URLs**:

   ```typescript
   function normalizeUrl(url: string): string {
     // 1. Lower-case
     let normalized = url.toLowerCase();

     // 2. Quitar querystring y hash
     normalized = normalized.split("?")[0].split("#")[0];

     // 3. Normalizar trailing slash
     normalized = normalized.replace(/\/$/, "");

     return normalized;
   }
   ```

2. **Matching con taxonomía**:

   ```typescript
   function extractTownAndCategoryFromUrl(url: string): {
     townId: TownId | null;
     categoryId: CategoryId | null;
   } {
     const normalized = normalizeUrl(url);
     const parts = normalized.split("/").filter(Boolean);

     // Buscar en ambos órdenes: /town/category y /category/town
     for (let i = 0; i < parts.length - 1; i++) {
       const part1 = parts[i];
       const part2 = parts[i + 1];

       // Intentar town-category
       const townId = matchTownIdFromPath(part1);
       const categoryId = matchCategoryIdFromPath(part2);

       if (townId && categoryId) {
         return { townId, categoryId };
       }

       // Intentar category-town
       const categoryId2 = matchCategoryIdFromPath(part1);
       const townId2 = matchTownIdFromPath(part2);

       if (townId2 && categoryId2) {
         return { townId: townId2, categoryId: categoryId2 };
       }
     }

     return { townId: null, categoryId: null };
   }
   ```

3. **Aplicar en endpoints**:
   - `/pueblos/details/[id]` con `categoryId` filter
   - `/drilldown/pueblo-categoria` (nuevo)
   - Filtros de filas GA4

---

## 8. RESUMEN DE CAMBIOS NECESARIOS

### PRIORIDAD CRÍTICA (Bloqueantes):

1. ✅ **FIX /drilldown/url**: xLabels completos con startDate/endDate
   - **Archivo**: `src/app/api/analytics/v1/drilldown/url/route.ts`
   - **Líneas**: ~180-200 (construcción del axis)
   - **Impacto**: Nivel 2 y Nivel 3 completamente rotos sin esto

### PRIORIDAD ALTA (Funcionalidad core):

2. **ChartPair - LineSide para "d"**: Usar GroupedBarSide con 1 fecha

   - **Archivo**: `src/components/common/ChartPair.tsx`
   - **Función**: `LineSide`
   - **Impacto**: Nivel 1 con granularidad diaria

3. **TownCategoryDrilldownPanel**: Refactor para top-5 y "d"

   - **Archivo**: `TownCategoryDrilldownPanel.tsx`
   - **Cambios**: Lógica de top-5, grouped bar para "d"
   - **Impacto**: Nivel 2 completo

4. **UrlDetailsPanel**: Verificar grouped bar para "d"
   - **Archivo**: `UrlDetailsPanel.tsx`
   - **Cambios**: Condicional para granularidad
   - **Impacto**: Nivel 3 con granularidad diaria

### PRIORIDAD MEDIA (Optimizaciones):

5. **Endpoint nuevo** (opcional): `/drilldown/pueblo-categoria`

   - **Archivo**: Crear nuevo route
   - **Ventaja**: 1 query en vez de N
   - **Impacto**: Performance en Nivel 2

6. **Normalización de URLs**: Helpers tipados
   - **Archivo**: `src/lib/utils/url/normalize.ts` (nuevo)
   - **Impacto**: Matching correcto en todos los niveles

### PRIORIDAD BAJA (Polish):

7. **DeltaCard**: Mensaje "Sin datos suficientes" para deltaPct === null

   - **Archivo**: `src/components/common/DeltaCard.tsx`
   - **Impacto**: UX

8. **Context.isReady**: Flag para renders seguros
   - **Archivo**: `UnifiedTimeContext.tsx`
   - **Impacto**: Prevención de bugs

---

## 9. PLAN DE IMPLEMENTACIÓN SUGERIDO

### Fase 1 - Fixes Críticos (DÍA 1):

1. ✅ FIX /drilldown/url con helpers `generateLabelsForRange` y `calculatePreviousRangeForAxis`
2. ✅ Testing con curl para todas las granularidades
3. ✅ Verificar mapeo de filas a buckets

### Fase 2 - Nivel 1 Completo (DÍA 1-2):

4. ✅ ChartPair LineSide para granularidad "d" → GroupedBarSide
5. ✅ Verificar donuts current-only en endpoints
6. ✅ Testing de Nivel 1 en ambas secciones (Town/Tag)

### Fase 3 - Nivel 2 Refactor (DÍA 2-3):

7. ✅ TownCategoryDrilldownPanel: top-5 URLs
8. ✅ Grouped bar para "d" en Nivel 2
9. ✅ Multi-línea para w/m/y en Nivel 2
10. ✅ Testing de Nivel 2

### Fase 4 - Nivel 3 Completo (DÍA 3):

11. ✅ UrlDetailsPanel con grouped bar para "d"
12. ✅ Verificar donuts secundarios current-only
13. ✅ Testing de Nivel 3

### Fase 5 - Optimizaciones (DÍA 4):

14. 🔄 Normalización de URLs (helpers)
15. 🔄 Endpoint nuevo `/drilldown/pueblo-categoria` (opcional)
16. 🔄 UX polish (mensajes, loading states)

---

## 10. CÓDIGO LISTO PARA COPY-PASTE

### 10.1 Helpers para /drilldown/url

```typescript
// src/lib/utils/time/axisHelpers.ts (NUEVO ARCHIVO)
import type { Granularity } from "@/lib/types";
import { addDaysUTC, parseISO, toISO } from "./datetime";

/**
 * Genera array de labels ISO para un rango según granularidad
 */
export function generateLabelsForRange(
  startISO: string,
  endISO: string,
  granularity: Granularity
): string[] {
  const labels: string[] = [];
  const start = parseISO(startISO);
  const end = parseISO(endISO);

  if (granularity === "y") {
    // Mensual: YYYY-MM
    let current = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)
    );

    while (current <= end) {
      const year = current.getUTCFullYear();
      const month = String(current.getUTCMonth() + 1).padStart(2, "0");
      labels.push(`${year}-${month}`);
      current = new Date(Date.UTC(year, current.getUTCMonth() + 1, 1));
    }
  } else {
    // Diario: YYYY-MM-DD
    let current = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
    );

    while (current <= end) {
      labels.push(toISO(current));
      current = addDaysUTC(current, 1);
    }
  }

  return labels;
}

/**
 * Calcula rango anterior del mismo tamaño (ventana contigua)
 */
export function calculatePreviousRangeForAxis(current: {
  start: string;
  end: string;
}): { start: string; end: string } {
  const startDate = parseISO(current.start);
  const endDate = parseISO(current.end);

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const duration = diffDays + 1; // inclusivo

  const prevEnd = addDaysUTC(startDate, -1);
  const prevStart = addDaysUTC(prevEnd, -(duration - 1));

  return {
    start: toISO(prevStart),
    end: toISO(prevEnd),
  };
}
```

### 10.2 Fix en /drilldown/url/route.ts

```typescript
// Importar helpers
import {
  generateLabelsForRange,
  calculatePreviousRangeForAxis,
} from "@/lib/utils/time/axisHelpers";

// En el GET handler, reemplazar la lógica del axis:
if (startISOParam) {
  const customRange = { start: startISOParam, end: endISO };
  const ga4Granularity = determineGA4Granularity(g);

  // Generar labels completos
  const xLabels = generateLabelsForRange(startISOParam, endISO, g);

  // Calcular previous
  const prevRange = calculatePreviousRangeForAxis(customRange);
  const prevLabels = generateLabelsForRange(prevRange.start, prevRange.end, g);

  // Convertir a keys
  const curKeys = xLabels.map((label) => label.replace(/-/g, ""));
  const prevKeys = prevLabels.map((label) => label.replace(/-/g, ""));

  axis = {
    dimensionTime: ga4Granularity === "y" ? "yearMonth" : "date",
    queryRange: { start: prevRange.start, end: customRange.end },
    curRange: customRange,
    prevRange: prevRange,
    xLabels: xLabels,
    curKeys: curKeys,
    prevKeys: prevKeys,
    curIndexByKey: new Map(curKeys.map((k, i) => [k, i])),
    prevIndexByKey: new Map(prevKeys.map((k, i) => [k, i])),
  };
} else {
  axis = buildLaggedAxisForGranularity(g, { endISO });
  const ga4Granularity = determineGA4Granularity(g);
  axis.dimensionTime = ga4Granularity === "y" ? "yearMonth" : "date";
}
```

---

## CONCLUSIÓN

**Lo más crítico para que funcione TODO:**

1. ✅ **FIX /drilldown/url** (1-2 horas)
2. ✅ **ChartPair ajustes para "d"** (30 min)
3. ✅ **TownCategoryDrilldownPanel top-5** (1 hora)

**Con estos 3 cambios**, el 80% de los requisitos funcionará.

El resto son optimizaciones y polish que pueden hacerse incrementalmente.

---

**FIN DEL ANÁLISIS**
