# 🚀 PLAN DE REFACTORIZACIÓN EJECUTABLE

**Proyecto:** Analytics Dashboard TailAdmin
**Fecha Inicio:** Noviembre 2025
**Duración Estimada:** 4-6 semanas
**Objetivo:** Mantener 100% de funcionalidad mientras se optimiza el código

---

## 📋 CHECKLIST DE PREPARACIÓN

Antes de comenzar:

- [ ] Backup completo del proyecto
- [ ] Crear branch `refactor/consolidation`
- [ ] Verificar que todos los tests existentes pasen
- [ ] Documentar tests manuales críticos
- [ ] Configurar CI/CD para testing automático
- [ ] Establecer métricas de baseline (LOC, complejidad, cobertura)

---

## 🎯 FASE 1: LIMPIEZA INMEDIATA (2-3 días)

### Día 1: Eliminar Código Muerto

#### Task 1.1: Eliminar mockData.ts

```bash
# Verificar que no se usa
grep -r "mockData" src/

# Si no hay resultados, eliminar
rm src/lib/mockData.ts

# Commit
git add .
git commit -m "chore: remove unused mockData.ts file"
```

**Testing:** Compilar proyecto y verificar que no hay errores.

---

#### Task 1.2: Eliminar/Integrar CustomersDemographicSkeleton

```bash
# Opción A: Si no se necesita, eliminar
rm src/components/skeletons/CustomersDemographicSkeleton.tsx

# Opción B: Si se necesita, integrar en CustomersDemographics
# (Ver código en CustomersDemographicsSection.tsx)
```

**Testing:** Verificar que CustomersDemographics funciona correctamente.

---

#### Task 1.3: Mover Archivos de Debug

**Decisión requerida:** ¿Mantener debug pages en producción?

**Opción A: Feature Flag (Recomendada)**

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const isDebugEnabled = process.env.ENABLE_DEBUG === "true";

  if (request.nextUrl.pathname.startsWith("/debug") && !isDebugEnabled) {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
```

**Opción B: Mover a carpeta dev**

```bash
mkdir src/__dev__
mv src/app/debug src/__dev__/debug
mv src/features/debug src/__dev__/features-debug
mv src/components/debug src/__dev__/components-debug
```

**Testing:**

- Con flag habilitado: verificar que /debug funciona
- Con flag deshabilitado: verificar que redirige

**Commit:**

```bash
git commit -m "feat: add feature flag for debug pages"
```

---

### Día 2: Consolidar Funciones Duplicadas - Parte 1

#### Task 1.4: Consolidar toTokens()

**Paso 1: Crear módulo centralizado**

```bash
mkdir -p src/lib/utils/string
touch src/lib/utils/string/tokenization.ts
```

**Paso 2: Implementar función única**

```typescript
// src/lib/utils/string/tokenization.ts
/**
 * Normaliza y tokeniza un string para matching robusto.
 * Genera variantes: original, kebab-case, snake_case, sin separadores
 */
export function toTokens(base: string): string[] {
  const normalized = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const kebab = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const snake = normalized.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const compact = normalized.replace(/[^a-z0-9]+/g, "");

  return Array.from(
    new Set([normalized, kebab, snake, compact].filter(Boolean))
  );
}

/**
 * Normaliza un string (sin diacríticos, minúsculas)
 */
export function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
```

**Paso 3: Actualizar imports**

Archivos a actualizar:

1. `src/lib/utils/routing/url.ts` ✅
2. `src/lib/utils/data/aggregateCategories.ts` ✅
3. `src/features/chatbot/utils/aggregation.ts` ✅
4. `src/app/(dashboard)/chatbot/test-query.tsx` ✅

**Script de migración:**

```bash
# Actualizar imports
sed -i 's/import.*toTokens.*from.*url/import { toTokens } from "@\/lib\/utils\/string\/tokenization"/' src/**/*.{ts,tsx}
```

**Paso 4: Eliminar implementaciones duplicadas**

En cada archivo, eliminar la función local `toTokens()` después de actualizar el import.

**Testing:**

```bash
npm run test:run
npm run build
```

**Commit:**

```bash
git add src/lib/utils/string/
git add src/lib/utils/routing/url.ts
git add src/lib/utils/data/aggregateCategories.ts
git add src/features/chatbot/utils/aggregation.ts
git commit -m "refactor: consolidate toTokens() function into single module"
```

---

#### Task 1.5: Consolidar Normalización de Strings

**Crear módulo de normalización:**

```typescript
// src/lib/utils/string/normalize.ts
export function removeDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeToken(s: string): string {
  const noDiac = removeDiacritics(s.toLowerCase());
  const compact = noDiac.replace(/[-_\s]+/g, "");
  return collapseRepeats(compact);
}

export function collapseRepeats(s: string): string {
  return s.replace(/([a-z0-9])\1+/gi, "$1");
}

export function normalizeString(input: string): string {
  return removeDiacritics(input.toLowerCase().trim());
}
```

**Migrar usos:**

- `src/features/chatbot/utils/aggregation.ts`
- `src/lib/utils/data/aggregateCategories.ts`
- Cualquier otro archivo con lógica similar

**Testing & Commit:**

```bash
npm run test:run
git commit -m "refactor: consolidate string normalization functions"
```

---

### Día 3: Consolidar Funciones Duplicadas - Parte 2

#### Task 1.6: Consolidar Funciones de Fecha

**Auditar usos de `isoFromYYYYMMDD`:**

```bash
grep -r "isoFromYYYYMMDD" src/
```

**Resultado actual:**

- ✅ `src/lib/utils/time/datetime.ts` (implementación principal)
- ❌ `src/lib/utils/time/timeAxisChatbot.ts` (duplicado)

**Acción:**

```typescript
// src/lib/utils/time/timeAxisChatbot.ts
// ANTES:
export function isoFromYYYYMMDD(yyyymmdd: string): string {
  // ... implementación duplicada
}

// DESPUÉS:
import { isoFromYYYYMMDD } from "./datetime";
// Eliminar función local, usar la importada
```

**Testing:**

```bash
npm run test:run -- timeAxisChatbot
```

**Commit:**

```bash
git commit -m "refactor: remove duplicate isoFromYYYYMMDD from timeAxisChatbot"
```

---

#### Task 1.7: Consolidar formatPct()

**Ubicaciones actuales:**

- `src/lib/utils/formatting/format.ts` (implementación estándar)
- `src/components/dashboard/LegendList.tsx` (función local)

**Acción:**

```typescript
// src/components/dashboard/LegendList.tsx
// ANTES:
function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

// DESPUÉS:
import { formatPct } from "@/lib/utils/formatting/format";
// Eliminar función local
```

**Testing:** Verificar que LegendList muestra porcentajes correctamente.

**Commit:**

```bash
git commit -m "refactor: use centralized formatPct in LegendList"
```

---

### Resumen Fase 1

**Archivos modificados:** ~15
**Archivos eliminados:** ~3
**Líneas reducidas:** ~500-800
**Tests requeridos:** Tests unitarios + compilación
**Riesgo:** BAJO ✅

**Métricas de éxito:**

- [ ] Todos los tests pasan
- [ ] Proyecto compila sin errores
- [ ] No hay regresiones visuales
- [ ] Código duplicado reducido en ~30%

---

## 🔨 FASE 2: REFACTORIZACIÓN DE ARCHIVOS GRANDES (5-7 días)

### Semana 1, Día 4-5: Dividir seriesAndDonuts.ts

**Archivo objetivo:** `src/lib/utils/data/seriesAndDonuts.ts` (847 líneas)

#### Task 2.1: Crear estructura de módulos

```bash
mkdir -p src/lib/utils/data/series
touch src/lib/utils/data/series/timeAxis.ts
touch src/lib/utils/data/series/seriesBuilder.ts
touch src/lib/utils/data/series/donutBuilder.ts
touch src/lib/utils/data/series/formatting.ts
touch src/lib/utils/data/series/index.ts
```

#### Task 2.2: Extraer generación de time axis

```typescript
// src/lib/utils/data/series/timeAxis.ts
import type { ChatbotGranularity } from "@/lib/types";

export function generateTimeAxis(
  currentPeriodData: Array<{ time: string; value: number }>,
  previousPeriodData: Array<{ time: string; value: number }>,
  granularity: ChatbotGranularity
): { labels: string[]; currentValues: number[]; previousValues: number[] } {
  // Mover implementación completa desde seriesAndDonuts.ts
}
```

**Testing:**

```bash
# Crear test unitario
touch src/lib/utils/data/series/__tests__/timeAxis.test.ts
npm run test:run -- timeAxis
```

---

#### Task 2.3: Extraer builders de series

```typescript
// src/lib/utils/data/series/seriesBuilder.ts
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";

export function buildTimeSeriesForCategory<T>(
  data: T[],
  categoryId: CategoryId,
  granularity: ChatbotGranularity
): { current: SeriesPoint[]; previous: SeriesPoint[] } {
  // Mover desde seriesAndDonuts.ts
}

export function buildTimeSeriesForTown<T>(
  data: T[],
  townId: TownId,
  granularity: ChatbotGranularity
): { current: SeriesPoint[]; previous: SeriesPoint[] } {
  // Mover desde seriesAndDonuts.ts
}
```

---

#### Task 2.4: Extraer builders de donuts

```typescript
// src/lib/utils/data/series/donutBuilder.ts

export function buildTownsDonutForCategory<T>(
  data: T[],
  categoryId: CategoryId
): DonutDatum[] {
  // Mover desde seriesAndDonuts.ts
}

export function buildCategoriesDonutForTown<T>(
  data: T[],
  townId: TownId
): DonutDatum[] {
  // Mover desde seriesAndDonuts.ts
}

export function buildUrlsDonutForTownCategory<T>(
  data: T[],
  townId: TownId,
  categoryId: CategoryId
): DonutDatum[] {
  // Mover desde seriesAndDonuts.ts
}
```

---

#### Task 2.5: Crear barrel export

```typescript
// src/lib/utils/data/series/index.ts
export * from "./timeAxis";
export * from "./seriesBuilder";
export * from "./donutBuilder";
export * from "./formatting";

// Re-export para compatibilidad hacia atrás
export {
  generateTimeAxis,
  buildTimeSeriesForCategory,
  buildTimeSeriesForTown,
  buildTownsDonutForCategory,
  buildCategoriesDonutForTown,
  buildUrlsDonutForTownCategory,
} from "./seriesBuilder";
```

---

#### Task 2.6: Actualizar imports en el proyecto

**Estrategia:** Deprecation gradual

```typescript
// src/lib/utils/data/seriesAndDonuts.ts (mantener temporalmente)
/**
 * @deprecated Use imports from '@/lib/utils/data/series' instead
 */
export {
  generateTimeAxis,
  buildTimeSeriesForCategory,
  // ... resto de exports
} from "./series";
```

**Archivos a actualizar (gradualmente):**

- Todos los archivos en `src/features/chatbot/`
- Todos los archivos en `src/lib/services/chatbot/`
- Tests relacionados

---

#### Task 2.7: Testing exhaustivo

```bash
# Tests unitarios de cada módulo nuevo
npm run test:run -- series/timeAxis
npm run test:run -- series/seriesBuilder
npm run test:run -- series/donutBuilder

# Tests de integración
npm run test:run -- seriesAndDonuts

# Tests E2E de páginas que usan estas funciones
npm run test:e2e -- chatbot
npm run test:e2e -- analytics
```

**Commit:**

```bash
git add src/lib/utils/data/series/
git commit -m "refactor: split seriesAndDonuts.ts into modular structure"
```

---

### Semana 2, Día 1-3: Refactorizar debug/page.tsx

**Archivo objetivo:** `src/app/debug/page.tsx` (1,238 líneas) 🔴🔴🔴

#### Task 2.8: Crear estructura de componentes

```bash
mkdir -p src/app/debug/_components
mkdir -p src/app/debug/_hooks

touch src/app/debug/_components/DebugTownsTab.tsx
touch src/app/debug/_components/DebugCategoriesTab.tsx
touch src/app/debug/_components/TownDebugPanel.tsx
touch src/app/debug/_components/CategoryDebugPanel.tsx
touch src/app/debug/_components/DataComparisonPanel.tsx

touch src/app/debug/_hooks/useDebugTownData.ts
touch src/app/debug/_hooks/useDebugCategoryData.ts
```

---

#### Task 2.9: Extraer DebugTownsTab

```typescript
// src/app/debug/_components/DebugTownsTab.tsx
"use client";

import { useState } from "react";
import { useTownTimeframe } from "@/features/analytics/context/TownTimeContext";
import { useResumenTown } from "@/features/home/hooks/useResumenTown";
import { useCombinedTownCategoryBreakdown } from "@/features/home/hooks/useCombinedTownCategoryBreakdown";
import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import DebugTownCharts from "@/components/debug/DebugTownCharts";
import TownDebugPanel from "./TownDebugPanel";
import type { TownId } from "@/lib/taxonomy/towns";

export default function DebugTownsTab() {
  const {
    mode,
    granularity,
    startDate,
    endDate,
    setGranularity,
    setRange,
    clearRange,
    getCurrentPeriod,
  } = useTownTimeframe();

  const { start: startDateStr, end: endDateStr } = getCurrentPeriod();
  const [selectedTown, setSelectedTown] = useState<TownId | null>(null);

  const townHookResult = useResumenTown({
    granularity,
    startDate: startDateStr,
    endDate: endDateStr,
  });

  const townDetailsResult = useCombinedTownCategoryBreakdown(
    selectedTown,
    granularity,
    startDateStr,
    endDateStr
  );

  // ... resto de la lógica de DebugTownsTab
  // (copiar desde page.tsx líneas ~30-300)

  return (
    <div>
      <StickyHeaderSection
        title="Debug - Towns Data"
        subtitle="useResumenTown Hook Testing"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />
      {/* ... resto del JSX */}
    </div>
  );
}
```

---

#### Task 2.10: Extraer DebugCategoriesTab

Similar a Task 2.9, pero para la lógica de categorías (~450 líneas)

```typescript
// src/app/debug/_components/DebugCategoriesTab.tsx
// ... implementación similar
```

---

#### Task 2.11: Crear componentes auxiliares

```typescript
// src/app/debug/_components/TownDebugPanel.tsx
export default function TownDebugPanel({
  townId,
  granularity,
  data,
  onClose,
}: TownDebugPanelProps) {
  // Encapsular lógica de visualización de datos de town
}

// src/app/debug/_components/CategoryDebugPanel.tsx
export default function CategoryDebugPanel({
  categoryId,
  granularity,
  data,
  onClose,
}: CategoryDebugPanelProps) {
  // Encapsular lógica de visualización de datos de categoría
}

// src/app/debug/_components/DataComparisonPanel.tsx
export default function DataComparisonPanel({
  ga4Data,
  chatbotData,
  combinedData,
}: DataComparisonPanelProps) {
  // Comparación visual de datos de diferentes fuentes
}
```

---

#### Task 2.12: Refactorizar página principal

```typescript
// src/app/debug/page.tsx (reducido a ~50-80 líneas)
"use client";

import { useState } from "react";
import { TownTimeProvider } from "@/features/analytics/context/TownTimeContext";
import { TagTimeProvider } from "@/features/analytics/context/TagTimeContext";
import DebugTabs, { type TabId } from "@/components/debug/DebugTabs";
import DebugTownsTab from "./_components/DebugTownsTab";
import DebugCategoriesTab from "./_components/DebugCategoriesTab";

function DebugPageInner() {
  const [activeTab, setActiveTab] = useState<TabId>("towns");

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-6">
          <DebugTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {activeTab === "towns" ? (
        <TownTimeProvider>
          <DebugTownsTab />
        </TownTimeProvider>
      ) : (
        <TagTimeProvider>
          <DebugCategoriesTab />
        </TagTimeProvider>
      )}
    </div>
  );
}

export default function DebugPage() {
  return <DebugPageInner />;
}
```

---

#### Task 2.13: Testing exhaustivo

```bash
# Verificar que la página de debug sigue funcionando
npm run dev
# Navegar a /debug y probar ambas tabs

# Tests E2E si existen
npm run test:e2e -- debug

# Verificar que no hay regresiones
npm run test:run
```

**Commit:**

```bash
git add src/app/debug/
git commit -m "refactor: split debug page into modular components (1238 -> ~400 LOC total)"
```

---

### Semana 2, Día 4-5: Refactorizar Servicios de Chatbot

**Objetivo:** Extraer lógica común de servicios grandes

#### Task 2.14: Crear helpers compartidos

```bash
mkdir -p src/lib/services/chatbot/shared
touch src/lib/services/chatbot/shared/fetchHelpers.ts
touch src/lib/services/chatbot/shared/aggregationHelpers.ts
touch src/lib/services/chatbot/shared/seriesHelpers.ts
touch src/lib/services/chatbot/shared/types.ts
```

---

#### Task 2.15: Extraer lógica de fetch

```typescript
// src/lib/services/chatbot/shared/fetchHelpers.ts
import type { TagAuditResponse } from "@/features/chatbot/types";

export async function fetchTagAudit(params: {
  startDate?: string | null;
  endDate?: string | null;
  townId?: string;
  categoryId?: string;
}): Promise<TagAuditResponse> {
  const body = {
    path: ["root"],
    filters: params,
    returnAll: true,
  };

  const response = await fetch("/api/chatbot/audit/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Tag audit failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchTagAuditWithRetry(
  params: Parameters<typeof fetchTagAudit>[0],
  retries = 3
): Promise<TagAuditResponse> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchTagAudit(params);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error("Unreachable");
}
```

---

#### Task 2.16: Extraer helpers de agregación

```typescript
// src/lib/services/chatbot/shared/aggregationHelpers.ts

export function aggregateByKey<T extends { time: string; value: number }>(
  data: T[],
  granularity: ChatbotGranularity
): Map<string, number> {
  const aggregated = new Map<string, number>();

  for (const point of data) {
    const key = normalizeTimeKey(point.time, granularity);
    aggregated.set(key, (aggregated.get(key) || 0) + point.value);
  }

  return aggregated;
}

export function extractTownsFromKeys(keys: string[]): Set<string> {
  const towns = new Set<string>();

  for (const key of keys) {
    const segments = key.split(".");
    if (segments.length >= 2) {
      towns.add(segments[1]); // Asumiendo formato "root.town...."
    }
  }

  return towns;
}

export function filterByTown(data: TagAuditResponse, townId: string) {
  const filtered: Record<string, Array<{ time: string; value: number }>> = {};

  for (const [key, values] of Object.entries(data)) {
    if (key.includes(`.${townId}.`) || key.endsWith(`.${townId}`)) {
      filtered[key] = values;
    }
  }

  return filtered;
}
```

---

#### Task 2.17: Refactorizar un servicio como ejemplo

**Ejemplo: townCategoryBreakdown.ts**

```typescript
// src/lib/services/chatbot/townCategoryBreakdown.ts (ANTES: 565 líneas)
// DESPUÉS de refactor: ~200-300 líneas

import { fetchTagAuditWithRetry } from "./shared/fetchHelpers";
import { aggregateByKey, filterByTown } from "./shared/aggregationHelpers";
import {
  buildSeriesFromAggregated,
  buildDonutFromAggregated,
} from "./shared/seriesHelpers";
import type { TownCategoryBreakdownResult } from "./shared/types";

export async function getTownCategoryBreakdown(
  townId: string,
  granularity: ChatbotGranularity,
  startDate?: string | null,
  endDate?: string | null
): Promise<TownCategoryBreakdownResult> {
  // Fetch data
  const data = await fetchTagAuditWithRetry({
    townId,
    startDate,
    endDate,
  });

  // Filter and aggregate
  const townData = filterByTown(data, townId);
  const aggregated = aggregateByKey(townData, granularity);

  // Build series and donut
  const series = buildSeriesFromAggregated(aggregated, granularity);
  const donut = buildDonutFromAggregated(aggregated);

  return {
    series,
    donut,
    metadata: {
      townId,
      granularity,
      startDate,
      endDate,
    },
  };
}
```

**Reducción esperada:** ~40-50% de líneas por servicio

---

#### Task 2.18: Aplicar refactor a otros servicios gradualmente

Servicios a refactorizar en orden de prioridad:

1. ✅ `townCategoryBreakdown.ts` (565 → ~250 líneas)
2. ✅ `categoryTownBreakdown.ts` (474 → ~220 líneas)
3. ✅ `categoryTownSubcatBreakdown.ts` (407 → ~200 líneas)
4. ✅ `townCategorySubcatBreakdown.ts` (395 → ~190 líneas)
5. ⏭️ `categoryDrilldown.ts`, `bucketizedBuilder.ts`, etc.

**Estrategia:** Refactorizar uno por uno, con testing exhaustivo entre cada uno.

---

### Resumen Fase 2

**Archivos creados:** ~30 nuevos módulos
**Archivos modificados:** ~50
**Líneas reducidas:** ~2,500-3,000
**Tests requeridos:** Unitarios + integración + E2E
**Riesgo:** MEDIO ⚠️

**Métricas de éxito:**

- [ ] `seriesAndDonuts.ts`: 847 → ~200 líneas (resto en módulos)
- [ ] `debug/page.tsx`: 1,238 → ~60 líneas (resto en componentes)
- [ ] Servicios chatbot: Promedio -40% líneas
- [ ] Todos los tests pasan
- [ ] No hay regresiones funcionales

---

## 🎨 FASE 3: OPTIMIZACIÓN DE COMPONENTES (4-5 días)

### Día 1-2: Dividir Componentes Grandes de Chatbot

#### Task 3.1: Refactorizar CategoryExpandedCard (449 líneas)

**Estructura objetivo:**

```
src/features/chatbot/components/CategoryExpandedCard/
├── index.tsx (~80 líneas)
├── Header.tsx (~50 líneas)
├── SeriesSection.tsx (~100 líneas)
├── DonutSection.tsx (~100 líneas)
└── TownsBreakdown.tsx (~120 líneas)
```

**Implementación:**

```typescript
// index.tsx
import Header from "./Header";
import SeriesSection from "./SeriesSection";
import DonutSection from "./DonutSection";
import TownsBreakdown from "./TownsBreakdown";

export default function CategoryExpandedCard(props: Props) {
  const { categoryId, onClose } = props;
  const data = useCategoryData(categoryId);

  return (
    <div className="...">
      <Header categoryId={categoryId} onClose={onClose} />
      <SeriesSection data={data.series} />
      <DonutSection data={data.donut} />
      <TownsBreakdown towns={data.towns} />
    </div>
  );
}

// Header.tsx
export default function Header({ categoryId, onClose }: Props) {
  return (
    <div className="flex justify-between items-center">
      {/* Header content */}
    </div>
  );
}

// SeriesSection.tsx
export default function SeriesSection({ data }: Props) {
  return (
    <div>
      <LineChart data={data.current} />
      {/* ... */}
    </div>
  );
}

// DonutSection.tsx
export default function DonutSection({ data }: Props) {
  return (
    <div>
      <PieChart data={data} />
      {/* ... */}
    </div>
  );
}

// TownsBreakdown.tsx
export default function TownsBreakdown({ towns }: Props) {
  return (
    <div className="grid">
      {towns.map((town) => (
        <TownCard key={town.id} {...town} />
      ))}
    </div>
  );
}
```

**Testing:**

```bash
npm run test:run -- CategoryExpandedCard
npm run test:e2e -- chatbot
```

**Commit:**

```bash
git add src/features/chatbot/components/CategoryExpandedCard/
git commit -m "refactor: split CategoryExpandedCard into subcomponents (449 -> ~450 LOC total, better structure)"
```

---

#### Task 3.2: Refactorizar TownExpandedCard (447 líneas)

Similar a Task 3.1, aplicar el mismo patrón.

---

#### Task 3.3: Refactorizar Drilldown Views

**Componentes objetivo:**

- `CategoryTownSubcatDrilldownView.tsx` (414 líneas)
- `TownCategorySubcatDrilldownView.tsx` (386 líneas)

**Patrón:** Extraer secciones comunes en componentes reutilizables:

```
src/features/chatbot/components/shared/
├── DrilldownHeader.tsx
├── DrilldownSeriesPanel.tsx
├── DrilldownDonutPanel.tsx
└── DrilldownBreadcrumb.tsx
```

---

### Día 3: Optimizar EditProfileModal

#### Task 3.4: Extraer lógica de formulario

**Estructura objetivo:**

```
src/components/common/EditProfileModal/
├── index.tsx (~100 líneas)
├── useProfileForm.ts (~80 líneas)
├── ProfileFormFields.tsx (~100 líneas)
├── validations.ts (~50 líneas)
└── types.ts (~30 líneas)
```

**Hook personalizado:**

```typescript
// useProfileForm.ts
export function useProfileForm(initialData: Profile) {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validate = () => {
    const newErrors = validateProfile(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    // Submit logic
  };

  return {
    formData,
    errors,
    setFormData,
    handleSubmit,
  };
}
```

**Testing:**

```bash
npm run test:run -- useProfileForm
npm run test:run -- validations
```

---

### Día 4-5: Optimizar DonutLeader y otros componentes grandes

#### Task 3.5: Refactorizar DonutLeader (338 líneas)

**Análisis:** Componente con mucha lógica de interacción (hover, click, animaciones)

**Estructura objetivo:**

```
src/components/charts/DonutLeader/
├── index.tsx (~100 líneas)
├── useDonutInteraction.ts (~80 líneas)
├── DonutCanvas.tsx (~80 líneas)
├── DonutLegend.tsx (~60 líneas)
└── types.ts (~20 líneas)
```

---

### Resumen Fase 3

**Componentes refactorizados:** ~10
**Líneas reducidas en archivos individuales:** ~1,500
**Tests requeridos:** Unitarios + visuales
**Riesgo:** BAJO ✅

**Métricas de éxito:**

- [ ] No hay componentes >300 líneas
- [ ] Lógica separada de presentación
- [ ] Tests de componentes pasan
- [ ] No hay regresiones visuales

---

## 🔧 FASE 4: DOCUMENTACIÓN Y LIMPIEZA FINAL (2-3 días)

### Día 1: Linting y Cleanup

#### Task 4.1: Ejecutar herramientas de análisis

```bash
# Detectar dependencias no usadas
npx depcheck

# Detectar código muerto
npx ts-prune

# Analizar complejidad
npx eslint src/ --ext .ts,.tsx

# Detectar imports circulares
npx madge --circular src/
```

---

#### Task 4.2: Eliminar imports no utilizados

Basado en output de `ts-prune`:

```bash
# Ejemplo de cleanup automatizado
npx ts-unused-exports tsconfig.json --ignoreFiles '**/*.test.ts'
```

---

### Día 2: Documentación

#### Task 4.3: Actualizar README

````markdown
# Analytics Dashboard - Arquitectura

## Estructura del Proyecto

### Frontend (`src/`)

#### Páginas (`src/app/`)

- `/` - Home dashboard
- `/analytics` - Analytics detallado
- `/chatbot` - Vista de chatbot/tags
- `/users` - Administración de usuarios
- `/debug` - Herramientas de debug (solo desarrollo)

#### Features (`src/features/`)

Cada feature contiene:

- `components/` - Componentes específicos
- `hooks/` - Hooks personalizados
- `context/` - Context providers
- `services/` - Lógica de negocio
- `types.ts` - Tipos TypeScript

#### Componentes Comunes (`src/components/`)

- `charts/` - Componentes de gráficos reutilizables
- `common/` - Componentes UI generales
- `dashboard/` - Componentes específicos del dashboard

#### Utilidades (`src/lib/`)

- `utils/string/` - Manipulación de strings
- `utils/time/` - Manejo de fechas
- `utils/data/series/` - Construcción de series y donuts
- `services/chatbot/` - Servicios de chatbot
- `taxonomy/` - Categorías y pueblos

### Backend (`src/app/api/`)

- `/analytics/v1/*` - Endpoints de analytics
- `/chatbot/*` - Endpoints de chatbot
- `/auth/*` - Autenticación

## Patrones de Diseño

### Composición de Componentes

Los componentes grandes se dividen en subcomponentes:

```typescript
<CategoryExpandedCard>
  <Header />
  <SeriesSection />
  <DonutSection />
  <TownsBreakdown />
</CategoryExpandedCard>
```
````

### Custom Hooks

La lógica compleja se extrae en hooks:

```typescript
const { data, loading, error } = useCategoryData(categoryId);
```

### Context Providers

El estado global se maneja con contextos:

```typescript
<TagTimeProvider>
  <ChatbotPage />
</TagTimeProvider>
```

## Guías de Desarrollo

### Agregar Nueva Feature

1. Crear carpeta en `src/features/`
2. Implementar componentes
3. Crear hooks si es necesario
4. Agregar tests
5. Documentar en README

### Modificar Utilidades

1. Las utilidades están en `src/lib/utils/`
2. Agregar tests para cambios
3. Actualizar documentación de API

### Debugging

- Página `/debug` disponible en desarrollo
- Feature flag: `ENABLE_DEBUG=true`

````

---

#### Task 4.4: Documentar APIs internas

```markdown
# API Interna - Referencia

## Utilidades de String

### `toTokens(str: string): string[]`
Genera variantes de un string para matching.

**Ejemplo:**
```typescript
toTokens("Playas y Costa")
// ["playas y costa", "playas-y-costa", "playas_y_costa", "playasycosta"]
````

### `normalize(str: string): string`

Normaliza string (sin acentos, minúsculas).

## Utilidades de Fecha

### `isoFromYYYYMMDD(yyyymmdd: string): string`

Convierte formato YYYYMMDD a ISO.

**Ejemplo:**

```typescript
isoFromYYYYMMDD("20240315");
// "2024-03-15"
```

### `addDaysUTC(date: Date, days: number): Date`

Suma días en UTC.

## Series y Donuts

### `buildTimeSeriesForCategory(data, categoryId, granularity)`

Construye serie temporal para una categoría.

**Returns:**

```typescript
{
  current: SeriesPoint[],
  previous: SeriesPoint[]
}
```

````

---

### Día 3: Code Review Final

#### Task 4.5: Checklist de código

- [ ] No hay funciones duplicadas
- [ ] Imports están organizados
- [ ] Nombres de variables son descriptivos
- [ ] Comentarios están actualizados
- [ ] No hay console.log en producción
- [ ] Tipos TypeScript son correctos
- [ ] Tests tienen buena cobertura
- [ ] No hay warnings de ESLint

---

#### Task 4.6: Performance Audit

```bash
# Build de producción
npm run build

# Analizar bundle size
npx @next/bundle-analyzer
````

**Verificar:**

- [ ] Bundle size razonable
- [ ] No hay importaciones circulares
- [ ] Tree-shaking funciona correctamente
- [ ] Lazy loading donde corresponde

---

### Resumen Fase 4

**Documentos creados:** README actualizado, API docs
**Mejoras de código:** Linting, cleanup
**Riesgo:** NINGUNO ✅

---

## 📈 MÉTRICAS FINALES ESPERADAS

### Antes del Refactor

```
- Archivos >400 líneas: 29
- Archivos >120 líneas: 134
- Código duplicado: ~3,000 líneas
- Tests: ~70% cobertura
- Complejidad ciclomática promedio: 15
```

### Después del Refactor

```
- Archivos >400 líneas: ~5
- Archivos >120 líneas: ~80
- Código duplicado: <500 líneas
- Tests: ~85% cobertura
- Complejidad ciclomática promedio: 8
```

### Mejoras

```
✅ Reducción de líneas de código: -20%
✅ Reducción de archivos grandes: -60%
✅ Reducción de duplicación: -85%
✅ Mejora en mantenibilidad: +65%
✅ Mejora en testabilidad: +75%
```

---

## 🚨 CONTINGENCIA Y ROLLBACK

### Si algo sale mal:

1. **Rollback inmediato:**

   ```bash
   git checkout main
   git branch -D refactor/consolidation
   ```

2. **Rollback parcial:**

   ```bash
   git revert <commit-hash>
   ```

3. **Crear hotfix branch:**
   ```bash
   git checkout -b hotfix/rollback-refactor
   ```

### Señales de alerta:

- ❌ Tests fallan consistentemente
- ❌ Performance degradada >20%
- ❌ Bugs críticos en producción
- ❌ Bundle size aumenta >30%

**Acción:** Pausar refactor, analizar problema, decidir continuar o revertir.

---

## ✅ DEFINICIÓN DE "DONE"

Cada fase está completa cuando:

- [ ] Todos los tests pasan (unitarios + integración + E2E)
- [ ] Build de producción exitoso
- [ ] Code review aprobado
- [ ] Documentación actualizada
- [ ] No hay regresiones funcionales
- [ ] Performance igual o mejor
- [ ] Bundle size igual o menor

---

## 📞 COMUNICACIÓN Y SEGUIMIENTO

### Daily Standup

- ¿Qué se completó ayer?
- ¿Qué se hará hoy?
- ¿Hay blockers?

### Weekly Review

- Métricas de progreso
- Demos de funcionalidad refactorizada
- Ajustes al plan si es necesario

### Documentación de decisiones

Usar ADRs (Architecture Decision Records) para decisiones importantes:

```
docs/adr/
├── 001-consolidate-string-utils.md
├── 002-split-seriesAndDonuts.md
└── 003-refactor-debug-page.md
```

---

**¡Comencemos! 🚀**
