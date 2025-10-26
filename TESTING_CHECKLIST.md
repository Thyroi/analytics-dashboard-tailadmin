# 🧪 TESTING CHECKLIST - Analytics Drilldown

**Fecha:** 26 de octubre de 2025
**Objetivo:** Validar flujo completo Level 0→1→2→3 con todas las granularidades

---

## 📋 PRE-REQUISITOS

- ✅ Servidor corriendo en `http://localhost:3000`
- ✅ Backend fix aplicado (/drilldown/url con xLabels completos)
- ✅ ChartPair LineSide usando GroupedBarChart para granularity "d"
- ✅ TOP-5 URLs implementado en Level 2
- ✅ Sentinel logs en todos los niveles

---

## 🎯 TEST 1: LEVEL 0 → LEVEL 1 (Town Section)

### Pasos:

1. **Abrir** `http://localhost:3000` (página de Analytics)
2. **Localizar** sección "Analíticas por municipio"
3. **Seleccionar granularidad**: "Día" (d)
4. **Click** en cualquier DeltaCard (ej: Almonte)

### ✅ Validaciones:

#### Console Logs esperados:

```javascript
[L1] town details params {
  townId: "almonte",
  g: "d",
  startISO: "2025-10-25",
  endISO: "2025-10-25"
}
```

#### UI esperada:

- ✅ Card expandida muestra:
  - **Gráfico**: GroupedBarChart con 1 fecha (ayer), 2 barras (actual vs anterior)
  - **Donut**: Categorías (Playas, Gastronomía, etc.)
  - **Delta**: Porcentaje de cambio

#### Comportamiento por granularidad:

- **d (día)**: 1 barra por periodo (ayer vs anteayer)
- **w (semana)**: Línea con 7 puntos
- **m (mes)**: Línea con 30 puntos
- **y (año)**: Línea con 12 puntos (meses)

---

## 🎯 TEST 2: LEVEL 1 → LEVEL 2 (Town + Category)

### Pasos:

1. **Con card expandida** (desde TEST 1)
2. **Click** en slice del donut (ej: "Playas")

### ✅ Validaciones:

#### Console Logs esperados:

```javascript
[L2] open town+cat {
  townId: "almonte",
  categoryId: "playas",
  g: "d",
  startISO: "2025-10-25",
  endISO: "2025-10-25"
}

[L2] TownCategoryDrilldownPanel render {
  townId: "almonte",
  categoryId: "playas",
  granularity: "d",
  startISO: "2025-10-25",
  endISO: "2025-10-25"
}

[L2] urls top5 5 g d

[L2] graph mode grouped {
  xLen: 1,
  seriesCount: 5
}
```

#### UI esperada:

- ✅ Panel drilldown desplegado con:
  - **Título**: "Almonte - Playas" (o similar)
  - **Gráfico**:
    - **Para "d"**: GroupedBarChart con TOP-5 URLs (5 categorías, 1 barra por URL)
    - **Para w/m/y**: Multi-línea con TOP-5 URLs
  - **Donut**: Todas las URLs (no solo top-5)

---

## 🎯 TEST 3: LEVEL 2 → LEVEL 3 (URL Individual)

### Pasos:

1. **Con panel drilldown visible** (desde TEST 2)
2. **Click** en slice del donut de URLs

### ✅ Validaciones:

#### Console Logs esperados:

```javascript
[L3] url details params {
  url: "https://...",
  g: "d",
  startISO: "2025-10-25",
  endISO: "2025-10-25"
}

[/drilldown/url] params {
  path: "https://...",
  granularity: "d",
  startDate: "2025-10-25",
  endDate: "2025-10-25"
}

[/drilldown/url] axis {
  granularity: "d",
  dimensionTime: "date",
  xLen: 1,
  cur: { start: "2025-10-25", end: "2025-10-25" },
  prev: { start: "2025-10-24", end: "2025-10-24" }
}

[/drilldown/url] payload sizes {
  xLen: 1,
  currLen: 1,
  prevLen: 1
}

[L3] xLabels vs seriesLen {
  xLen: 1,
  currLen: 1,
  prevLen: 1,
  granularity: "d"
}
```

#### UI esperada:

- ✅ Panel de detalles URL con:
  - **Título**: "Detalle de URL"
  - **KPIs**: Usuarios, Interacciones/sesión, Tiempo/usuario, Tiempo medio sesión
  - **Gráfico Engagement**:
    - **Para "d"**: 1 punto (ChartSection usa ChartPair internamente)
    - **Para w/m/y**: Línea con múltiples puntos
  - **Donuts**: Sistemas Operativos, Dispositivos, Países (current-only)

---

## 🎯 TEST 4: GRANULARIDAD "m" (Mes - 30 días)

### Pasos:

1. **Cerrar** todos los drilldowns expandidos
2. **Cambiar granularidad** a "Mes" (m) en el header
3. **Repetir** TEST 1, 2, 3

### ✅ Validaciones específicas:

#### Backend (Console Network):

```javascript
// Endpoint /drilldown/url debe retornar:
{
  xLabels: ["2025-09-26", "2025-09-27", ..., "2025-10-25"], // 30 elementos
  seriesAvgEngagement: {
    current: [/* 30 valores */],
    previous: [/* 30 valores */]
  }
}
```

#### Console Logs:

```javascript
[/drilldown/url] axis { xLen: 30, ... }
[/drilldown/url] payload sizes { xLen: 30, currLen: 30, prevLen: 30 }
[L3] xLabels vs seriesLen { xLen: 30, currLen: 30, prevLen: 30, granularity: "m" }
```

#### UI esperada:

- ✅ Level 1: Línea con 30 puntos
- ✅ Level 2: Multi-línea con hasta 5 series (TOP-5)
- ✅ Level 3: Línea con 30 puntos de engagement

---

## 🎯 TEST 5: GRANULARIDAD "w" (Semana - 7 días)

### Pasos similares a TEST 4, pero con granularidad "Semana"

### ✅ Validaciones:

```javascript
[/drilldown/url] axis { xLen: 7, ... }
[/drilldown/url] payload sizes { xLen: 7, currLen: 7, prevLen: 7 }
[L3] xLabels vs seriesLen { xLen: 7, currLen: 7, prevLen: 7, granularity: "w" }
```

#### UI esperada:

- ✅ Todos los gráficos muestran 7 puntos (líneas)

---

## 🎯 TEST 6: GRANULARIDAD "y" (Año - 12 meses)

### Pasos similares, granularidad "Año"

### ✅ Validaciones:

```javascript
[/drilldown/url] axis {
  xLen: 12,
  dimensionTime: "yearMonth", // ← Importante para "y"
  ...
}
[/drilldown/url] payload sizes { xLen: 12, currLen: 12, prevLen: 12 }

// xLabels en formato YYYY-MM:
{
  xLabels: ["2024-11", "2024-12", "2025-01", ..., "2025-10"]
}
```

#### UI esperada:

- ✅ Todos los gráficos muestran 12 puntos (meses)
- ✅ Labels formateados como "Nov 2024", "Dic 2024", etc.

---

## 🎯 TEST 7: TAG SECTION (Analíticas por categoría)

### Pasos:

1. **Scroll** a sección "Analíticas por categoría"
2. **Repetir** flujo completo Level 0→1→2→3

### ✅ Validaciones:

#### Console Logs:

```javascript
[L1] tag details params {
  categoryId: "playas",
  g: "m",
  startISO: "...",
  endISO: "..."
}

[L2] open town+cat {
  townId: "almonte",
  categoryId: "playas",
  g: "m",
  startISO: "...",
  endISO: "..."
}
```

#### UI esperada:

- ✅ Mismo comportamiento que Town Section
- ✅ Donut de Level 1 muestra **pueblos** (no categorías)

---

## 🎯 TEST 8: CAMBIO DE RANGO CUSTOM

### Pasos:

1. **Click** en DatePicker del header
2. **Seleccionar** rango custom (ej: últimos 15 días)
3. **Validar** que granularidad se calcula automáticamente
4. **Repetir** drilldown completo

### ✅ Validaciones:

```javascript
[/drilldown/url] params {
  startDate: "<fecha_custom>",
  endDate: "<fecha_custom>",
  granularity: "<auto_calculada>"
}

[/drilldown/url] axis {
  xLen: 15, // según rango seleccionado
  ...
}
```

---

## 🚨 PROBLEMAS CONOCIDOS A VIGILAR

### ❌ Si ves esto, HAY BUG:

1. **xLabels.length !== series.length**

   ```javascript
   // MAL:
   [L3] xLabels vs seriesLen { xLen: 1, currLen: 30, ... } // ❌

   // BIEN:
   [L3] xLabels vs seriesLen { xLen: 30, currLen: 30, ... } // ✅
   ```

2. **Gráfico muestra 1 solo punto para granularidad !== "d"**

   - Verificar en Network tab que `/drilldown/url` retorna array completo
   - Si backend OK pero UI muestra 1 punto → Bug en frontend (slice o truncamiento)

3. **TOP-5 no funciona (Level 2 hace N fetches)**

   ```javascript
   // MAL: Ver muchos logs [/drilldown/url] params
   // BIEN: Ver solo 5 logs para granularidad !== "d"
   ```

4. **Granularidad "d" muestra línea en vez de barras**
   - Verificar que ChartPair LineSide detecta correctamente `granularity === "d"`

---

## 📊 RESUMEN DE LOGS POR NIVEL

| Nivel       | Sentinel Log                           | Trigger                              |
| ----------- | -------------------------------------- | ------------------------------------ |
| **0→1**     | `[L1] town/tag details params`         | Click DeltaCard                      |
| **1→2**     | `[L2] open town+cat`                   | Click donut slice (categoría/pueblo) |
| **2**       | `[L2] urls top5`, `[L2] graph mode`    | Panel drilldown render               |
| **2→3**     | `[L3] url details params`              | Click donut slice (URL)              |
| **3**       | `[L3] xLabels vs seriesLen`            | UrlDetailsPanel render               |
| **Backend** | `[/drilldown/url] params/axis/payload` | Fetch URL data                       |

---

## ✅ CRITERIOS DE ÉXITO

### 🟢 PASA si:

1. ✅ Todos los sentinel logs aparecen con params correctos
2. ✅ xLabels.length coincide con series.length en todos los niveles
3. ✅ Granularidad "d" muestra barras agrupadas (no líneas)
4. ✅ Granularidad w/m/y muestra líneas con N puntos correctos
5. ✅ Level 2 solo fetchea TOP-5 URLs (máximo 5 requests a /drilldown/url)
6. ✅ Donuts siempre muestran datos current-only
7. ✅ No hay useEffect firing en console (no deberían verse logs de efectos)

### 🔴 FALLA si:

1. ❌ xLabels tiene longitud 1 para granularidad !== "d"
2. ❌ Backend retorna arrays completos pero UI muestra 1 punto
3. ❌ Granularidad "d" muestra línea (debería ser barras)
4. ❌ Level 2 hace más de 5 fetches para URLs
5. ❌ Donuts incluyen datos de previous period
6. ❌ Hay re-renders infinitos o loops en console

---

## 🔧 COMANDOS ÚTILES DE DEBUGGING

### Ver logs filtrados en DevTools Console:

```javascript
// Solo backend:
[/drilldown/url]

// Solo frontend:
[L1]|[L2]|[L3]

// Todos los sentinels:
\[L[0-9]\]|\[/drilldown/url\]
```

### Verificar payload en Network tab:

1. Abrir DevTools → Network
2. Filtrar por: `drilldown/url`
3. Click en request
4. Ver Response → Validar `xLabels.length`

---

## 📝 NOTAS

- Los sentinel logs son **obligatorios** para debugging
- Si NO ves los logs, revisar que console.log no está deshabilitado
- Todos los tests deben pasar para las 4 granularidades: d, w, m, y
- El flujo debe funcionar tanto en Town Section como en Tag Section

---

**FIN DEL CHECKLIST**
