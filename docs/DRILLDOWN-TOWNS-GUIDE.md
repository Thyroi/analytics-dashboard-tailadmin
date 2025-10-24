# Guía de Drilldown: Towns → Categorías → Subcategorías

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Flujo de Navegación](#flujo-de-navegación)
4. [Cálculo de Métricas](#cálculo-de-métricas)
5. [Modo Anual (Agrupación Mensual)](#modo-anual-agrupación-mensual)
6. [Integración con React Query](#integración-con-react-query)
7. [Troubleshooting](#troubleshooting)
8. [Checklists QA](#checklists-qa)

---

## Visión General

El sistema de drilldown permite explorar datos jerárquicamente en tres niveles:

- **Nivel 0**: Grid de Towns (pueblos)
- **Nivel 1**: Town → Categorías (ej: Playas, Eventos, Gastronomía)
- **Nivel 2**: Categoría → Subcategorías (ej: Carabeo, Bolonia dentro de Playas)

### Características principales

- ✅ Navegación fluida 0→1→2 con botones "Volver"
- ✅ Cálculo automático de deltas (current vs previous)
- ✅ Agrupación mensual automática en modo anual
- ✅ Filtrado por profundidad de jerarquía
- ✅ Sincronización con DatePicker y StickyHeader
- ✅ Invalidación automática de cache con React Query

---

## Arquitectura del Sistema

### Estructura de archivos

```
src/
├── features/chatbot/
│   ├── components/
│   │   ├── ChatbotTownsSection.tsx          # Container Nivel 0
│   │   ├── TownExpandedCard.tsx             # Vista Nivel 1 (categorías)
│   │   └── TownCategorySubcatDrilldownView.tsx  # Vista Nivel 2 (subcategorías)
│   ├── hooks/
│   │   ├── useTownCategoryBreakdown.ts      # Hook Nivel 1
│   │   └── useTownCategorySubcatBreakdown.ts    # Hook Nivel 2
│   └── __tests__/
│       └── drilldown-integration.test.ts    # Tests integración
├── lib/services/chatbot/
│   ├── townCategoryBreakdown.ts             # Servicio Nivel 1
│   └── townCategorySubcatBreakdown.ts       # Servicio Nivel 2
└── lib/taxonomy/
    ├── categories.ts                         # Definición de categorías
    └── category-synonyms.ts                  # Sinónimos para matching
```

### Patrones de datos

**Nivel 1 (Categorías):**
```
Pattern: root.<townId>.*
Profundidad: 3
Ejemplo: root.almonte.playas
```

**Nivel 2 (Subcategorías):**
```
Pattern: root.<townId>.<categoryId>.*
Profundidad: 4
Ejemplo: root.almonte.playas.carabeo
```

---

## Flujo de Navegación

### Nivel 0 → Nivel 1 (Town → Categorías)

**Componente:** `ChatbotTownsSection`

```tsx
const [selectedTownId, setSelectedTownId] = useState<string | null>(null);

// Click en card de town
const handleSelectTown = (town: TownCardData) => {
  setSelectedTownId(town.id);
  // TownExpandedCard se renderiza
};
```

**Vista:** `TownExpandedCard`
- Muestra donut chart con breakdown por categorías
- Muestra bar chart agrupado (current vs previous)
- Cada categoría tiene botón "Ver desglose"

### Nivel 1 → Nivel 2 (Categoría → Subcategorías)

**Componente:** `TownExpandedCard`

```tsx
const [drilldownCategoryId, setDrilldownCategoryId] = useState<CategoryId | null>(null);

if (drilldownCategoryId) {
  return (
    <TownCategorySubcatDrilldownView
      townId={townId}
      categoryId={drilldownCategoryId}
      onBack={() => setDrilldownCategoryId(null)}
      // ... props de tiempo
    />
  );
}
```

**Vista:** `TownCategorySubcatDrilldownView`
- Muestra todas las subcategorías encontradas
- Renderiza bar chart comparativo (current vs previous)
- Botón "Volver" regresa a Nivel 1

### Diagrama de flujo

```
┌──────────────────────────────────────────────────────────┐
│ Nivel 0: ChatbotTownsSection                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                     │
│ │ Almonte │ │  Moguer │ │ Huelva  │ ... (Grid de towns) │
│ └────┬────┘ └─────────┘ └─────────┘                     │
│      │ click                                              │
│      ▼                                                     │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Nivel 1: TownExpandedCard (Almonte)                │   │
│ │ ┌─────────┐ ┌─────────┐ ┌──────────┐              │   │
│ │ │ Playas  │ │ Eventos │ │ Comercio │ ... (Donut)  │   │
│ │ └────┬────┘ └─────────┘ └──────────┘              │   │
│ │      │ "Ver desglose"                              │   │
│ │      ▼                                              │   │
│ │ ┌─────────────────────────────────────────────┐   │   │
│ │ │ Nivel 2: TownCategorySubcatDrilldownView    │   │   │
│ │ │ (Almonte → Playas)                          │   │   │
│ │ │ • Carabeo (150 visitas, +20%)               │   │   │
│ │ │ • Bolonia (120 visitas, -5%)                │   │   │
│ │ │ • Punta Umbría (80 visitas, +15%)           │   │   │
│ │ │                                              │   │   │
│ │ │ [← Volver]                                   │   │   │
│ │ └─────────────────────────────────────────────┘   │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## Cálculo de Métricas

### Delta Percentage (deltaPct / deltaPercent)

**Fórmula:**
```typescript
function computeDeltaPercent(current: number, prev: number): number | null {
  if (prev <= 0) return null;  // Evitar división por cero
  return ((current - prev) / prev) * 100;
}
```

**Ejemplos:**
- current=150, prev=100 → `deltaPct = 50%` (incremento de 50%)
- current=80, prev=100 → `deltaPct = -20%` (decremento de 20%)
- current=50, prev=0 → `deltaPct = null` (sin datos previos)

### Rangos Contiguos (Previous Period)

El sistema calcula automáticamente un rango "previous" contiguo al rango "current" para comparaciones.

**Ejemplo con 15 días:**
```
Current:  2024-10-15 → 2024-10-29 (15 días)
Previous: 2024-09-30 → 2024-10-14 (15 días, contiguo)
```

**Función:** `computeRangesForKPI(windowGranularity, startISO, endISO)`

**Reglas importantes:**
- ✅ Previous es **contiguo** (sin gap)
- ✅ Previous tiene **misma duración** que current
- ✅ **No hay doble offset** (error común en implementaciones naive)

### Totales por Categoría/Subcategoría

**Nivel 1 (Categorías):**
1. Fetch data con pattern `root.<town>.*`
2. Filtrar solo keys con profundidad === 3
3. Extraer token categoría (ej: `root.almonte.playas` → `playas`)
4. Mapear a CategoryId usando sinónimos
5. Sumar valores de todas las series

**Nivel 2 (Subcategorías):**
1. Fetch data con pattern `root.<town>.<category>.*`
2. Filtrar solo keys con profundidad === 4
3. Extraer token subcategoría (ej: `root.almonte.playas.carabeo` → `carabeo`)
4. Normalizar nombre (trim, lowercase, colapsar espacios)
5. Sumar valores de todas las series

---

## Modo Anual (Agrupación Mensual)

Cuando `windowGranularity="y"`, las series se agrupan automáticamente por mes (YYYY-MM) con un máximo de 12 buckets.

### Proceso

1. **Request a API:** Siempre con `granularity="d"` (diaria)
2. **Respuesta:** Series con formato `YYYYMMDD`
3. **Agrupación cliente:** Función `groupSeriesByMonth()`
4. **Output:** Series con formato `YYYY-MM`, máximo 12 buckets

### Ejemplo

**Input (granularity="d"):**
```typescript
[
  { time: "20241001", value: 10 },
  { time: "20241015", value: 20 },
  { time: "20241020", value: 15 },
  { time: "20241101", value: 25 },
  { time: "20241115", value: 30 },
]
```

**Output (agrupado a YYYY-MM):**
```typescript
[
  { time: "2024-10", value: 45 },  // 10 + 20 + 15
  { time: "2024-11", value: 55 },  // 25 + 30
]
```

### Función de agrupación

```typescript
function groupSeriesByMonth(
  series: Array<{ time: string; value: number }>
): Array<{ time: string; value: number }> {
  const monthMap = new Map<string, number>();

  for (const point of series) {
    // time formato: YYYYMMDD → extraer YYYY-MM
    const yearMonth = `${point.time.slice(0, 4)}-${point.time.slice(4, 6)}`;
    const current = monthMap.get(yearMonth) || 0;
    monthMap.set(yearMonth, current + point.value);
  }

  // Convertir a array y ordenar
  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([time, value]) => ({ time, value }));
}
```

---

## Integración con React Query

### QueryKeys

**Nivel 1 (Categorías):**
```typescript
["townCategoryBreakdown", townId, startISO, endISO, windowGranularity, db]
```

**Nivel 2 (Subcategorías):**
```typescript
["townCategorySubcatBreakdown", townId, categoryId, startISO, endISO, windowGranularity, db]
```

### Invalidación manual

Los hooks exponen handlers para invalidar y refetch:

```typescript
const { invalidate, refetch } = useTownCategoryBreakdown({
  townId: "almonte",
  startISO: "2024-10-01",
  endISO: "2024-10-31",
  windowGranularity: "d",
});

// Desde StickyHeader al cambiar rango
const handleRangeChange = (start: string, end: string) => {
  setRange(start, end);
  invalidate(); // Invalida cache
  refetch();    // Refetch inmediato
};
```

### Configuración React Query

```typescript
{
  staleTime: 5 * 60 * 1000,      // 5 minutos
  gcTime: 10 * 60 * 1000,        // 10 minutos
  refetchOnWindowFocus: false,   // No refetch al cambiar tab
  refetchOnMount: false,         // No refetch en mount si data en cache
  retry: 2,                      // Reintentar 2 veces en error
}
```

---

## Troubleshooting

### Tabla de Problemas Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| **Categoría no aparece en donut** | Token no coincide con sinónimos | Verificar `category-synonyms.ts`, añadir variante |
| **Subcategoría con nombre extraño** | Mayúsculas/minúsculas inconsistentes | Normalización automática (lowercase, trim) |
| **Town sin datos** | Pattern incorrecto o town sin visitas | Verificar pattern `root.<townId>.*` en request |
| **Delta siempre null** | Previous period sin datos | Normal si no hay histórico, verificar rango |
| **Request timeout** | Rango muy amplio o DB lenta | Reducir rango, verificar timeout (15s) |
| **Profundidad incorrecta** | Filtro prof !== 3 o 4 | Verificar `parts.length` en parsers |
| **Series no agrupadas en anual** | `windowGranularity` no es "y" | Pasar prop correcta desde StickyHeader |
| **Cache no invalida** | QueryKey no incluye fechas | Verificar que startISO/endISO estén en queryKey |
| **Doble offset en previous** | Cálculo manual incorrecto | Usar `computeRangesForKPI()` |

### Debug checklist

**Si no aparecen datos:**
1. ✅ Verificar network tab: ¿request se envía?
2. ✅ Verificar response.code === 200
3. ✅ Verificar response.output (Nivel 1) o response.data (Nivel 2)
4. ✅ Verificar pattern en request body
5. ✅ Verificar profundidad de keys en response
6. ✅ Verificar sinónimos en `category-synonyms.ts`

**Si delta es incorrecto:**
1. ✅ Verificar que previous period tiene datos
2. ✅ Verificar cálculo: `(current - prev) / prev * 100`
3. ✅ Verificar que prev > 0 (si no, debe ser null)

**Si modo anual no agrupa:**
1. ✅ Verificar `windowGranularity === "y"`
2. ✅ Verificar que `groupSeriesByMonth()` se llama
3. ✅ Verificar formato de series: `{ time: "YYYYMMDD", value: number }`

---

## Checklists QA

### ✅ Checklist Nivel 1 (Categorías)

- [ ] **Datos básicos**
  - [ ] Donut chart muestra todas las categorías con datos > 0
  - [ ] Bar chart agrupado muestra current vs previous
  - [ ] Categorías sin datos NO aparecen (solo las con currentTotal > 0)
  
- [ ] **Navegación**
  - [ ] Click en town abre TownExpandedCard
  - [ ] Botón "Cerrar" vuelve al grid
  - [ ] Scroll position se preserva al volver
  
- [ ] **Métricas**
  - [ ] deltaPct es null cuando prevTotal <= 0
  - [ ] deltaPct es correcto cuando prevTotal > 0
  - [ ] Totales suman correctamente (verificar contra raw data)
  
- [ ] **Rangos**
  - [ ] Cambiar rango en DatePicker → refetch automático
  - [ ] Previous period es contiguo (sin gap)
  - [ ] Previous period tiene misma duración que current
  
- [ ] **Patterns**
  - [ ] Request usa pattern `root.<townId>.*`
  - [ ] Solo keys con profundidad === 3 se incluyen
  - [ ] Sinónimos mapean correctamente a CategoryId

### ✅ Checklist Nivel 2 (Subcategorías)

- [ ] **Datos básicos**
  - [ ] Bar chart muestra todas las subcategorías encontradas
  - [ ] Subcategorías con 0 datos se muestran (currentTotal = 0)
  - [ ] Nombres normalizados (lowercase, sin espacios extras)
  
- [ ] **Navegación**
  - [ ] Click "Ver desglose" abre vista Nivel 2
  - [ ] Botón "Volver" regresa a Nivel 1
  - [ ] Estado de Nivel 1 se preserva al volver
  
- [ ] **Métricas**
  - [ ] deltaPct es null cuando prevTotal <= 0
  - [ ] deltaPct es correcto cuando prevTotal > 0
  - [ ] Totales correctos por subcategoría
  
- [ ] **Patterns**
  - [ ] Request usa pattern `root.<townId>.<categoryId>.*`
  - [ ] Solo keys con profundidad === 4 se incluyen
  - [ ] Subcategorías se normalizan correctamente

### ✅ Checklist Modo Anual

- [ ] **Agrupación mensual**
  - [ ] Series se agrupan a YYYY-MM
  - [ ] Máximo 12 buckets
  - [ ] Valores se suman correctamente por mes
  
- [ ] **Request**
  - [ ] Request sigue usando granularity="d"
  - [ ] Agrupación ocurre en cliente, no en API
  
- [ ] **Visualización**
  - [ ] Chart muestra labels YYYY-MM
  - [ ] Tooltips muestran total mensual
  - [ ] Orden cronológico correcto

### ✅ Checklist Granularidad Automática

- [ ] **15 días → granularity="d"**
  - [ ] Request usa "d"
  - [ ] Chart muestra datos diarios
  
- [ ] **45 días → granularity="w"**
  - [ ] Request usa "w"
  - [ ] Chart muestra datos semanales
  
- [ ] **120 días → granularity="m"**
  - [ ] Request usa "m"
  - [ ] Chart muestra datos mensuales

### ✅ Checklist Lock de Granularidad

- [ ] **Lock OFF (automático)**
  - [ ] Cambiar rango recalcula granularity
  - [ ] 15d→"d", 45d→"w", 120d→"m"
  
- [ ] **Lock ON (manual)**
  - [ ] Cambiar rango NO cambia granularity
  - [ ] Selector de granularity habilitado
  - [ ] Granularity seleccionada se mantiene

### ✅ Checklist Timeouts y Errores

- [ ] **Timeout (15s)**
  - [ ] Request se cancela después de 15s
  - [ ] Error message se muestra al usuario
  - [ ] Skeleton loader se oculta
  
- [ ] **Error de API**
  - [ ] 4xx/5xx muestra mensaje de error
  - [ ] Error no rompe la aplicación
  - [ ] Retry button disponible
  
- [ ] **Sin datos**
  - [ ] Empty state se muestra correctamente
  - [ ] Mensaje informativo al usuario
  - [ ] No se muestran errores en consola

### ✅ Checklist Invalidación de Cache

- [ ] **Cambio de rango**
  - [ ] Cache se invalida
  - [ ] Refetch automático
  - [ ] Loader se muestra durante refetch
  
- [ ] **Cambio de granularidad**
  - [ ] Cache se invalida
  - [ ] Refetch automático
  - [ ] QueryKey incluye granularity
  
- [ ] **Navegación**
  - [ ] Volver a Nivel 1 → datos en cache
  - [ ] No refetch innecesario
  - [ ] staleTime respetado (5 min)

---

## Referencias

### Archivos clave

- **Servicios:**
  - `src/lib/services/chatbot/townCategoryBreakdown.ts`
  - `src/lib/services/chatbot/townCategorySubcatBreakdown.ts`

- **Hooks:**
  - `src/features/chatbot/hooks/useTownCategoryBreakdown.ts`
  - `src/features/chatbot/hooks/useTownCategorySubcatBreakdown.ts`

- **Componentes:**
  - `src/features/chatbot/components/ChatbotTownsSection.tsx`
  - `src/features/chatbot/components/TownExpandedCard.tsx`
  - `src/features/chatbot/components/TownCategorySubcatDrilldownView.tsx`

- **Tests:**
  - `src/features/chatbot/__tests__/drilldown-integration.test.ts`
  - `src/lib/services/chatbot/townCategoryBreakdown.test.ts`
  - `src/lib/services/chatbot/townCategorySubcatBreakdown.test.ts`

### Taxonomía

- **Categorías:** `src/lib/taxonomy/categories.ts`
- **Sinónimos:** `src/lib/taxonomy/category-synonyms.ts`
- **Towns:** `src/lib/taxonomy/towns.ts`

### Utilidades

- **Rangos:** `src/lib/utils/time/timeWindows.ts` (`computeRangesForKPI`)
- **Granularidad:** `src/lib/utils/time/granularityRanges.ts`
- **Política de fechas:** `src/lib/utils/time/date-offset-policy.ts`

---

## Notas de Implementación

### Consideraciones de rendimiento

- ✅ React Query cache evita requests duplicados
- ✅ staleTime de 5 minutos reduce requests innecesarios
- ✅ Timeout de 15s previene requests colgados
- ✅ AbortController cancela requests en unmount

### Consideraciones de UX

- ✅ Skeleton loaders durante fetch
- ✅ Error messages informativos
- ✅ Empty states con calls-to-action
- ✅ Navegación intuitiva con botones "Volver"
- ✅ Preservación de scroll position

### Testing

- ✅ 195 tests unitarios e integración
- ✅ Cobertura de casos edge (sin datos, timeout, errores)
- ✅ Tests de navegación multinivel
- ✅ Tests de cálculo de métricas
- ✅ Tests de agrupación mensual

---

**Última actualización:** 2025-10-24  
**Versión:** 1.0.0  
**PRs relacionados:** #11, #12, #13, #14
