# 🔧 Guía de Depuración del Drilldown de Analytics

**Fecha:** 2025-01-26
**Estado:** Instrumentación completa agregada

---

## 🎯 Flujo del Drilldown

### **Nivel 0: Grid de Cards Colapsadas**

Usuario ve grid de categorías/pueblos con deltas

### **Nivel 1: Card Expandida (SectorExpandedCardDetailed)**

Al hacer click en una card:

- Se muestra `SectorExpandedCardDetailed`
- Contiene: ChartPair con series + donut de nivel 1
- El donut muestra pueblos (si es categoría) o categorías (si es pueblo)

### **Nivel 2: Drilldown Panel (TownCategoryDrilldownPanel)**

Al hacer click en el donut de nivel 1:

- Se activa `handleSliceClick` → crea `level2Data`
- Se renderiza `TownCategoryDrilldownPanel`
- **Aquí es donde está fallando actualmente**

### **Nivel 3: URL Details Panel**

Al hacer click en el donut de nivel 2 (URLs):

- Se muestra `UrlDetailsPanel` con detalles de la URL

---

## 📊 Logs a Buscar en la Consola

### **1. Cuando haces click en una card del grid:**

```
🎨 SectorExpandedCardDetailed RENDER: {
  title: "Naturaleza",
  hasLevel2: false,  // ← Debe ser false inicialmente
  level2: undefined
}
```

### **2. Cuando haces click en una slice del donut (nivel 1):**

**En AnalyticsByTagSection (categorías):**

```
🍩 handleDonutTopClick in SectorExpandedCardDetailed: {
  label: "Almonte",  // ← Nombre del pueblo clickeado
  hasOnSliceClick: true
}

🍩 handleSliceClick ANALYTICS TAG: {
  label: "Almonte",
  townId: "almonte",
  expandedId: "naturaleza",
  currentDrill: { kind: "category", categoryId: "naturaleza" }
}

🎯 Setting new drill for TAG: {
  kind: "town+cat",
  townId: "almonte",
  categoryId: "naturaleza"
}

📦 level2Data ANALYTICS TAG: {
  townId: "almonte",
  categoryId: "naturaleza",
  granularity: "day",  // o "week"/"month"
  endISO: "2025-01-26T00:00:00.000Z"
}
```

**En AnalyticsByTownSection (pueblos):**

```
🍩 handleDonutTopClick in SectorExpandedCardDetailed: {
  label: "Naturaleza",  // ← Nombre de categoría clickeada
  hasOnSliceClick: true
}

🍩 handleSliceClick ANALYTICS TOWN: {
  label: "Naturaleza",
  categoryId: "naturaleza",
  expandedId: "almonte",
  currentDrill: { kind: "town", townId: "almonte" }
}

🎯 Setting new drill for TOWN: {
  kind: "town+cat",
  townId: "almonte",
  categoryId: "naturaleza"
}

📦 level2Data ANALYTICS TOWN: {
  townId: "almonte",
  categoryId: "naturaleza",
  granularity: "day",
  endISO: "2025-01-26T00:00:00.000Z"
}
```

### **3. Cuando se renderiza el componente expandido CON level2:**

```
🎨 SectorExpandedCardDetailed RENDER: {
  title: "Naturaleza",
  hasLevel2: true,  // ← Ahora debe ser true
  level2: {
    townId: "almonte",
    categoryId: "naturaleza",
    granularity: "day",
    endISO: "2025-01-26T00:00:00.000Z"
  }
}
```

### **4. Cuando se monta TownCategoryDrilldownPanel:**

```
🎯 TownCategoryDrilldownPanel RENDER: {
  townId: "almonte",
  categoryId: "naturaleza",
  granularity: "day",
  headline: "category",  // o "town"
  endISO: "2025-01-26T00:00:00.000Z"
}

🌐 useDrilldownDetails URL: {
  type: "pueblo-category",
  url: "/api/analytics/v1/dimensions/pueblos/details/almonte?granularity=day&endDate=2025-01-26T00:00:00.000Z&categoryId=naturaleza",
  queryString: "granularity=day&endDate=2025-01-26T00:00:00.000Z&categoryId=naturaleza"
}

🚀 Fetching drilldown data from: /api/analytics/v1/dimensions/pueblos/details/almonte?granularity=day&endDate=2025-01-26T00:00:00.000Z&categoryId=naturaleza

📊 useDrilldownDetails STATE: {
  isLoading: true,
  hasError: false,
  error: undefined,
  hasData: false
}
```

### **5a. Si la request es EXITOSA:**

```
✅ Drilldown data received: {
  property: "pueblos",
  id: "almonte",
  seriesLength: 30,  // ← número de días
  donutLength: 5     // ← número de URLs
}

📊 useDrilldownDetails STATE: {
  isLoading: false,
  hasError: false,
  error: undefined,
  hasData: true
}

🎯 useDrilldownDetails RESULT: {
  loading: false,
  hasDonut: 5,
  donutSample: [
    { label: "/naturaleza/espacios-naturales", value: 123 },
    { label: "/naturaleza/flora", value: 89 },
    { label: "/naturaleza/fauna", value: 67 }
  ]
}
```

### **5b. Si hay ERROR (lo que está pasando ahora):**

```
📊 useDrilldownDetails STATE: {
  isLoading: false,
  hasError: true,
  error: "Failed to fetch",  // o "404 Not Found"
  hasData: false
}

🎯 useDrilldownDetails RESULT: {
  loading: true,  // ← Se mantiene en loading en caso de error
  hasDonut: "N/A",
  donutSample: "N/A"
}
```

---

## 🔍 Cómo Depurar

### **Paso 1: Verificar que el flujo inicial funciona**

1. Abre la página de Analytics (Categorías o Pueblos)
2. Haz click en una card del grid
3. **Busca en consola:** `🎨 SectorExpandedCardDetailed RENDER` con `hasLevel2: false`
4. ✅ Si aparece, el nivel 1 funciona

### **Paso 2: Verificar el click en el donut**

1. Haz click en una slice del donut
2. **Busca en consola:** Secuencia completa:
   - `🍩 handleDonutTopClick`
   - `🍩 handleSliceClick ANALYTICS TAG` (o TOWN)
   - `🎯 Setting new drill`
   - `📦 level2Data`
3. **Verifica que:** `level2Data` tenga `townId`, `categoryId`, `granularity` y `endISO`
4. ✅ Si todo está presente, el estado se actualizó correctamente

### **Paso 3: Verificar que level2 llega al componente**

1. Después del click, busca:
   - `🎨 SectorExpandedCardDetailed RENDER` con `hasLevel2: true`
2. **Verifica que:** el objeto `level2` tenga todos los campos
3. ✅ Si aparece, el prop se está pasando correctamente

### **Paso 4: Verificar que se monta TownCategoryDrilldownPanel**

1. Busca:
   - `🎯 TownCategoryDrilldownPanel RENDER`
2. **Verifica que:** reciba `townId`, `categoryId`, `granularity`, `endISO`
3. ✅ Si aparece, el componente se está montando

### **Paso 5: Verificar la construcción de la URL del API**

1. Busca:
   - `🌐 useDrilldownDetails URL`
2. **Verifica la URL construida:**
   - Formato: `/api/analytics/v1/dimensions/{pueblos|categorias}/details/{id}?...`
   - Query string: debe tener `granularity`, `endDate`, y `categoryId` o `townId`
3. **Copia la URL completa** y pruébala manualmente en el navegador
4. ✅ Si funciona en el navegador, el problema NO es el API

### **Paso 6: Identificar el error de red**

1. Busca:
   - `🚀 Fetching drilldown data from:`
   - `📊 useDrilldownDetails STATE`
2. **Si `hasError: true`:**
   - Mira el mensaje de `error`
   - Abre la pestaña Network en DevTools
   - Busca la request fallida
   - Verifica:
     - Status code (404, 500, etc.)
     - Response body
     - Request headers

---

## 🚨 Problemas Comunes y Soluciones

### **Problema 1: URL mal formada**

**Síntoma:** `🌐 useDrilldownDetails URL` muestra una URL incorrecta

**Posibles causas:**

- `townId` o `categoryId` undefined/null
- `granularity` inválida
- `endISO` mal formateada

**Solución:**

- Verifica que `level2Data` tenga valores válidos en `📦 level2Data`

---

### **Problema 2: Level2 no se pasa al componente**

**Síntoma:** `🎨 SectorExpandedCardDetailed RENDER` siempre muestra `hasLevel2: false`

**Posibles causas:**

- `drill` no se actualiza después del click
- `level2Data` es `undefined` en el useMemo
- El componente no se re-renderiza

**Solución:**

- Verifica que `🎯 Setting new drill` aparezca
- Verifica que `📦 level2Data` tenga un objeto (no undefined)
- Chequea si hay un `key` en SectorsGrid que esté bloqueando el re-render

---

### **Problema 3: API devuelve 404**

**Síntoma:** `📊 useDrilldownDetails STATE` muestra `hasError: true` con error "404"

**Posibles causas:**

- El endpoint no existe
- Los IDs son inválidos
- El servidor no está corriendo

**Solución:**

- Verifica que el servidor esté corriendo
- Prueba la URL manualmente copiando de `🌐 useDrilldownDetails URL`
- Revisa que los endpoints estén implementados en `/api/analytics/v1/dimensions/`

---

### **Problema 4: TownCategoryDrilldownPanel no se renderiza**

**Síntoma:** Nunca aparece `🎯 TownCategoryDrilldownPanel RENDER`

**Posibles causas:**

- `level2` es undefined
- Hay un error de sintaxis/imports
- El componente está siendo desmontado

**Solución:**

- Verifica que `hasLevel2: true` en el log anterior
- Busca errores de TypeScript en la consola
- Verifica que el import de `TownCategoryDrilldownPanel` sea correcto

---

## 📝 Próximos Pasos

1. **Abre la aplicación** en modo desarrollo
2. **Abre DevTools** → Pestaña Console
3. **Filtra por uno de estos emojis:** 🎨 🍩 🎯 📦 🌐 🚀 📊 ✅
4. **Sigue el flujo** desde el paso 1 hasta donde falle
5. **Copia toda la secuencia de logs** y compártela

Con esta información podremos identificar exactamente dónde está el problema.
