# DATE_OFFSET_POLICY.md

Política de offsets, rangos y granularidades del sistema de Analytics

## 🎯 Objetivo

Definir una **única capa de offset** que aplique consistentemente el clamp a "ayer UTC" y evite dobles offsets que causaban errores off-by-one.

---

## 📋 Tabla de Contenidos

1. [¿Quién aplica el clamp a "ayer"?](#quién-aplica-el-clamp-a-ayer)
2. [Regla de Previous Contiguo](#regla-de-previous-contiguo)
3. [WindowGranularity vs RequestGranularity](#windowgranularity-vs-requestgranularity)
4. [Formato de fechas](#formato-de-fechas)
5. [Ejemplos antes/después](#ejemplos-antesdespués)
6. [Tests de regresión](#tests-de-regresión)

---

## ¿Quién aplica el clamp a "ayer"?

### ✅ Single Clamp Layer (PR #2)

**Responsable:** `DatePicker` / `StickyHeaderBar` (UI component)

**Cuándo:** Al seleccionar fechas en el picker o al inicializar el componente

**Cómo:**

```typescript
// En DatePicker/StickyHeaderBar
const yesterday = addDaysUTC(todayUTC(), -1);
const endClamped = endDate > yesterday ? yesterday : endDate;
```

**Por qué:**

- El usuario puede seleccionar "hoy" en el picker
- Los datos de analytics no están disponibles para "hoy" (requieren procesamiento)
- El clamp asegura que el `endDate` máximo sea siempre "ayer UTC"

### ❌ NO aplican offset

**Servicios, hooks, API routes:**

- `fetchChatbotCategoryTotals()`
- `fetchChatbotTownTotals()`
- `useChatbotCategoryTotals()`
- `/api/chatbot/audit/tags`
- etc.

**Reciben:** Fechas ya clamped desde el UI
**Aplican:** CERO offsets adicionales
**Usan:** `computeRangesForKPI(granularity, startISO, endISO)` directamente

---

## Regla de Previous Contiguo

### 📏 Política (PR #3)

**Previous = ventana contigua del mismo tamaño**

```typescript
// Dado current: [2024-01-15, 2024-01-21] (7 días)
// Previous:     [2024-01-08, 2024-01-14] (7 días, termina 1 día antes)

const durationDays = daysBetween(current.start, current.end); // inclusivo
const prevEnd = addDaysUTC(parseISO(current.start), -1);
const prevStart = addDaysUTC(prevEnd, -(durationDays - 1));
```

**Sin shifts especiales por granularidad:**

- ❌ Antes: granularity "y" → shift de 1 mes (comportamiento inconsistente)
- ✅ Ahora: todas las granularidades → previous contiguo del mismo tamaño

**Ventajas:**

- Comparación justa (mismo número de días)
- Predecible (no depende de la granularidad)
- Simplifica lógica (una sola regla)

---

## WindowGranularity vs RequestGranularity

### 🪟 WindowGranularity (PR #5)

**Tipo:** `"d" | "w" | "m" | "y"`

**Propósito:** Granularidad de la **ventana de visualización** (UI/charts)

**Usado en:**

- DatePicker / StickyHeaderBar (selector UI)
- React Query keys
- Cálculo de buckets para series/gráficas
- Determinación automática por duración

**Ejemplo:**

```typescript
// Usuario selecciona rango de 45 días
const windowGranularity: WindowGranularity = "w"; // Visualizar por semanas
```

### 📡 RequestGranularity (PR #5)

**Tipo:** `"d" | "y"`

**Propósito:** Granularidad enviada a **APIs externas** (GA4, Chatbot/Mindsaic)

**Conversión:**

```typescript
function toRequestGranularity(
  window: WindowGranularity,
  target: "chatbot" | "ga4"
): RequestGranularity {
  if (target === "chatbot") {
    return "d"; // Chatbot SIEMPRE usa "d" (datos diarios)
  }

  if (target === "ga4") {
    return window === "y" ? "y" : "d"; // GA4 solo soporta "d" o "y"
  }
}
```

**Tabla de conversión:**

| WindowGranularity | Chatbot Request | GA4 Request | Notas                       |
| ----------------- | --------------- | ----------- | --------------------------- |
| `"d"`             | `"d"`           | `"d"`       | Diario en ambos             |
| `"w"`             | `"d"`           | `"d"`       | Chatbot agrega en memoria   |
| `"m"`             | `"d"`           | `"d"`       | Chatbot agrega en memoria   |
| `"y"`             | `"d"`           | `"y"`       | GA4 usa yearMonth dimension |

---

## Formato de fechas

### 🗓️ Interno (App)

**Formato:** `YYYY-MM-DD` (ISO 8601)

**Usado en:**

- Variables de estado React
- React Query keys
- Parámetros de funciones
- API routes (query params)

**Ejemplo:**

```typescript
const startISO = "2024-01-15";
const endISO = "2024-01-21";
```

### 🔌 Externo (APIs)

**Mindsaic/Chatbot:** `YYYYMMDD` (sin guiones)

**Conversión:**

```typescript
function formatDateForMindsaic(dateISO: string): string {
  return dateISO.replace(/-/g, ""); // "2024-01-15" → "20240115"
}
```

**GA4:** Usa `YYYY-MM-DD` directamente en `dateRanges`

### 🌍 Timezone

**Política:** **UTC TOTAL** (PR #1)

- Todas las fechas se parsean como UTC medianoche
- Todas las operaciones usan `addDaysUTC`, `parseISO`, `toISO`
- ❌ NO usar `new Date("YYYY-MM-DD")` (usa timezone local)
- ✅ Usar `parseISO("YYYY-MM-DD")` (fuerza UTC)

```typescript
// ❌ MAL (timezone local)
const date = new Date("2024-01-15"); // 2024-01-15T00:00:00 LOCAL

// ✅ BIEN (UTC)
const date = parseISO("2024-01-15"); // 2024-01-15T00:00:00Z
```

---

## Ejemplos antes/después

### Ejemplo 1: Seleccionar "hoy" en DatePicker

#### ❌ Antes (doble offset)

```typescript
// Usuario selecciona hoy: 2024-01-21
const endDate = "2024-01-21";

// ❌ Servicio aplica offset interno
function fetchData(endDate) {
  const yesterday = addDays(endDate, -1); // "2024-01-20"
  const ranges = computeRanges(yesterday); // offset #2
  // Result: datos de 2024-01-19 (off-by-one!)
}
```

**Problema:** Dos capas aplican offset → resultado incorrecto

#### ✅ Ahora (single clamp)

```typescript
// Usuario selecciona hoy: 2024-01-21
// DatePicker detecta y clampea
const endClamped = clampToYesterday("2024-01-21"); // "2024-01-20"

// ✅ Servicio NO aplica offset
function fetchData(endDate) {
  const ranges = computeRangesForKPI("d", null, endDate); // usa endDate tal cual
  // Result: datos de 2024-01-20 ✓
}
```

**Solución:** Una sola capa (UI) aplica clamp → resultado correcto

---

### Ejemplo 2: Rango de 7 días con granularity "d"

#### ✅ Ahora (previous contiguo)

```typescript
// Usuario: [2024-01-15, 2024-01-21] (7 días), granularity "d"
const ranges = computeRangesForKPI("d", "2024-01-15", "2024-01-21");

// Result:
{
  current: { start: "2024-01-15", end: "2024-01-21" },   // 7 días
  previous: { start: "2024-01-08", end: "2024-01-14" }   // 7 días, contiguo
}
```

**Ventaja:** Previous tiene exactamente la misma duración → comparación justa

---

### Ejemplo 3: Granularity anual con Chatbot

#### ✅ Ahora (windowGranularity vs requestGranularity)

```typescript
// Usuario: granularity "y" (anual)
const windowGranularity: WindowGranularity = "y";

// 1. Calcular rangos (365 días)
const ranges = computeRangesForKPI("y", null, "2024-01-20");
// current: [2023-01-21, 2024-01-20] (365 días)

// 2. Request a Chatbot (siempre "d")
const requestGranularity = toRequestGranularity("y", { target: "chatbot" }); // "d"
const payload = {
  granularity: "d", // ← siempre diario para Chatbot
  startTime: "20230121",
  endTime: "20240120",
};

// 3. Agregación en memoria (12 buckets mensuales)
const series = aggregateByYearMonth(chatbotData); // YYYY-MM buckets
```

**Ventaja:** API recibe datos diarios, agregación flexible en cliente

---

## Tests de regresión

### 🧪 Tests implementados

#### 1. Clamp a ayer (integración)

```typescript
test("seleccionar hoy → clamp a ayer, sin doble offset", () => {
  const today = todayUTC();
  const yesterday = addDaysUTC(today, -1);

  // UI clampea
  const endClamped = clampToYesterday(today);
  expect(endClamped).toBe(toISO(yesterday));

  // Servicio NO aplica offset adicional
  const ranges = computeRangesForKPI("d", null, endClamped);
  expect(ranges.current.end).toBe(endClamped); // sin offset!
});
```

#### 2. Auto-granularidad por duración

```typescript
test("15 días → d, 45 días → w, 120 días → m (Lock=off)", () => {
  expect(determineVisualizationGranularityByDuration(15)).toBe("d");
  expect(determineVisualizationGranularityByDuration(45)).toBe("w");
  expect(determineVisualizationGranularityByDuration(120)).toBe("m");
});
```

#### 3. Lock de granularidad

```typescript
test("granularidad manual → Lock=on y persiste", () => {
  // Usuario selecciona granularidad manual
  const [granularity, setGranularity] = useState("w");
  const [isLocked, setIsLocked] = useState(false);

  // Cambio manual activa lock
  const handleGranularityChange = (newGranularity) => {
    setGranularity(newGranularity);
    setIsLocked(true); // ← bloquea auto-recálculo
  };

  // Cambio de rango NO recalcula si locked
  const handleRangeChange = (newRange) => {
    if (!isLocked) {
      const duration = daysBetween(newRange.start, newRange.end);
      setGranularity(determineByDuration(duration));
    }
  };
});
```

#### 4. Chatbot anual (12 buckets)

```typescript
test("chatbot windowGranularity=y → 12 buckets mensuales", () => {
  const ranges = computeRangesForKPI("y", null, "2024-01-20");
  // current: 365 días [2023-01-21, 2024-01-20]

  const requestGranularity = toRequestGranularity("y", { target: "chatbot" });
  expect(requestGranularity).toBe("d"); // siempre diario

  // Chatbot devuelve datos diarios
  const dailyData = fetchChatbotData({ granularity: "d", ...ranges });

  // Agregación en memoria por YYYY-MM
  const monthlyBuckets = aggregateByYearMonth(dailyData);
  expect(monthlyBuckets).toHaveLength(12); // 12 meses
});
```

#### 5. Cards completas (todos los IDs)

```typescript
test("cards renderizan TODOS los IDs, 0/null si no hay datos", () => {
  const response = await fetchChatbotCategoryTotals();

  // Todas las categorías presentes
  expect(response.categories).toHaveLength(CATEGORY_ID_ORDER.length);

  // Cada categoría tiene su ID (aunque no tenga datos)
  CATEGORY_ID_ORDER.forEach((categoryId) => {
    const category = response.categories.find(
      (c) => c.categoryId === categoryId
    );
    expect(category).toBeDefined();
    expect(category.currentTotal).toBeGreaterThanOrEqual(0);
    // deltaPercent puede ser null si prevTotal <= 0
  });
});
```

---

## 🛡️ Guards contra regresión

### Lint rule (opcional)

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@/lib/utils/time/dateRangeWindow",
            message:
              "dateRangeWindow.ts está deprecado. Usa timeWindows.ts y computeRangesForKPI() en su lugar.",
          },
        ],
      },
    ],
  },
};
```

### Git hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Bloquear commits que importen dateRangeWindow
if git diff --cached | grep -q "from.*dateRangeWindow"; then
  echo "❌ Error: Intento de importar dateRangeWindow.ts (deprecado)"
  echo "   Usa timeWindows.ts y computeRangesForKPI() en su lugar"
  exit 1
fi
```

---

## 📚 Referencias

- **PR #1:** UTC normalización (`parseISO`, `toISO`, `addDaysUTC`)
- **PR #2:** Single clamp layer (DatePicker aplica, servicios NO)
- **PR #3:** `computeRangesForKPI` unificado (previous contiguo)
- **PR #4:** Eliminación de `dateRangeWindow.ts` deprecado
- **PR #5:** Tipos `WindowGranularity` y `RequestGranularity`
- **PR #6-7:** Servicios chatbot con WindowGranularity
- **PR #8:** API routes con `computeRangesForKPI`

---

## 🎓 Guía rápida para desarrolladores

### ¿Necesito aplicar offset a "ayer"?

**NO.** Las fechas ya vienen clamped desde el UI.

### ¿Cómo calculo rangos?

```typescript
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";

const ranges = computeRangesForKPI(
  windowGranularity, // "d" | "w" | "m" | "y"
  startISO || null, // "2024-01-15" o null
  endISO || null // "2024-01-21" o null (usa ayer por defecto)
);
```

### ¿Qué granularidad uso para el request?

```typescript
import { toRequestGranularity } from "@/lib/utils/time/granularityHelpers";

const requestGranularity = toRequestGranularity(
  windowGranularity,
  { target: "chatbot" } // o "ga4"
);
```

### ¿Cómo formateo fechas para Mindsaic?

```typescript
const mindsaicDate = startISO.replace(/-/g, ""); // "2024-01-15" → "20240115"
```

### ¿Cómo parseo fechas en UTC?

```typescript
import { parseISO, toISO, addDaysUTC } from "@/lib/utils/time/datetime";

const date = parseISO("2024-01-15"); // UTC medianoche
const tomorrow = addDaysUTC(date, 1); // +1 día UTC
const iso = toISO(tomorrow); // "2024-01-16"
```

---

## ✅ Checklist de código nuevo

Antes de agregar código que maneje fechas/rangos:

- [ ] ¿Uso `parseISO()` en lugar de `new Date()`?
- [ ] ¿Uso `addDaysUTC()` en lugar de `.setDate()`?
- [ ] ¿Uso `computeRangesForKPI()` en lugar de calcular rangos inline?
- [ ] ¿NO aplico offset adicional a "ayer"?
- [ ] ¿Uso `WindowGranularity` para UI y `RequestGranularity` para APIs?
- [ ] ¿Formateo fechas correctamente para cada API (YYYYMMDD para Mindsaic)?
- [ ] ¿Incluyo granularidad en la React Query key?
- [ ] ¿Uso handlers en lugar de useEffect para fetch?

---

**Última actualización:** PR #10 - Octubre 2025
