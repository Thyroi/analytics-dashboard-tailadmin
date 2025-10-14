# Fix: Reactividad en Nivel 3 del Drilldown

## Problema Identificado

El nivel 3 del drilldown (UrlDetailsPanel) no se actualizaba reactivamente cuando el usuario hacía clic en una URL diferente en la dona del nivel 2. El componente mantenía los datos antiguos en lugar de mostrar la información de la nueva URL seleccionada.

### Causa Raíz

El código original tenía varios problemas:

1. **Uso excesivo de `useEffect`**: Había múltiples `useEffect` que causaban re-renders innecesarios y podían generar loops infinitos
2. **Falta de invalidación de queries**: Al cambiar `selectedPath`, no se invalidaban las queries anteriores de React Query
3. **Sin keys únicos**: Los componentes no tenían `key` props que forzaran re-renders cuando cambiaban los parámetros críticos
4. **Estado no sincronizado**: El estado local no se sincronizaba correctamente con las queries de React Query

## Solución Implementada

### 1. Eliminación de `useEffect` Problemáticos

**Antes:**

```tsx
// reset selección al cambiar town/cat
useEffect(() => {
  setSelectedPath(null);
}, [townId, categoryId]);

// auto-scroll cuando hay selección
useEffect(() => {
  if (!selectedPath) return;
  const t = setTimeout(() => {
    detailsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 0);
  return () => clearTimeout(t);
}, [selectedPath]);
```

**Después:**

```tsx
// ❌ ELIMINADOS - Usamos keys de React en su lugar
```

### 2. Handler con Invalidación Explícita

**Nuevo código:**

```tsx
const queryClient = useQueryClient();

// Handler para click en dona - actualiza estado e invalida queries
const handleDonutSliceClick = (sub: string) => {
  const candidate = pickPathForSubActivity(sub, dd.seriesByUrl as UrlSeries[]);

  if (candidate) {
    // Si es el mismo path, no hacer nada
    if (candidate === selectedPath) return;

    // Actualizar estado
    setSelectedPath(candidate);

    // Invalidar query anterior para forzar refetch
    queryClient.invalidateQueries({
      queryKey: ["url-drilldown", selectedPath, granularity, endISO],
    });

    // Hacer scroll al nivel 3
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }
};
```

### 3. Keys Únicos para Forzar Re-renders

**En `TownCategoryDrilldownPanel.tsx`:**

```tsx
// Generar key único basado en townId + categoryId + selectedPath
const level3Key = useMemo(
  () => `${townId}-${categoryId}-${selectedPath || "none"}`,
  [townId, categoryId, selectedPath]
);

// Aplicar key al UrlDetailsPanel
<UrlDetailsPanel
  key={level3Key}
  path={selectedPath}
  // ... otras props
/>;
```

**En `SectorExpandedCardDetailed/index.tsx`:**

```tsx
{
  level2 && (
    <div ref={level2Ref} className="scroll-mt-24">
      <TownCategoryDrilldownPanel
        key={`${level2.townId}-${level2.categoryId}-${level2.granularity}`}
        townId={level2.townId}
        categoryId={level2.categoryId}
        granularity={level2.granularity}
        headline="category"
        endISO={level2.endISO}
      />
    </div>
  );
}
```

## Flujo de Datos Actualizado

### Nivel 1 → Nivel 2

1. Usuario hace clic en una categoría/pueblo en la dona del nivel 1
2. `handleSliceClick` en el componente padre (AnalyticsByTownSection/AnalyticsByTagSection)
3. **NUEVO**: Se invalidan queries de drilldown con `queryClient.invalidateQueries()`
4. Se actualiza el state `drill` con el nuevo drill
5. El `level2Data` cambia en el grid
6. **CRÍTICO**: El `key` de `SectorExpandedCardDetailed` cambia (incluye townId + categoryId)
7. React desmonta el componente anterior y monta uno nuevo con los datos correctos
8. El `TownCategoryDrilldownPanel` se inicializa con `selectedPath = null`

### Nivel 2 → Nivel 3

1. Usuario hace clic en una URL en la dona del nivel 2
2. `handleDonutSliceClick` verifica que no sea la misma URL
3. Actualiza `selectedPath` con el nuevo valor
4. Invalida la query anterior en React Query
5. El `key` de `UrlDetailsPanel` cambia (incluye selectedPath)
6. React Query hace fetch de los datos de la nueva URL
7. Auto-scroll al nivel 3

## Beneficios

✅ **Sin loops infinitos**: Eliminados todos los `useEffect` problemáticos
✅ **Reactividad completa**: Los cambios en nivel 2 y 3 son instantáneos
✅ **Control explícito**: Sabemos exactamente cuándo se invalidan queries
✅ **Mejor rendimiento**: React remonta componentes solo cuando cambian keys críticos
✅ **Código más limpio**: Menos efectos secundarios, más declarativo

## Archivos Modificados

1. `src/features/analytics/sectors/expanded/SectorExpandedCardDetailed/TownCategoryDrilldownPanel.tsx`

   - Eliminados `useEffect` para reset y scroll
   - Agregado `useQueryClient` para invalidaciones
   - Creado `handleDonutSliceClick` con lógica completa
   - Agregado `level3Key` para `UrlDetailsPanel`

2. `src/features/analytics/sectors/expanded/SectorExpandedCardDetailed/index.tsx`

   - Agregado `key` único al `TownCategoryDrilldownPanel`

3. `src/components/common/SectorsGrid.tsx` ⚠️ **CRÍTICO**

   - Agregado `key` dinámico al `SectorExpandedCardDetailed` que incluye `level2Data`
   - Formato: `${id}-${townId}-${categoryId}-${granularity}`
   - **Esto fuerza re-mount cuando cambia cualquier parámetro del nivel 2**

4. `src/features/analytics/sections/AnalyticsByTownSection.tsx`

   - Agregado `useQueryClient`
   - `handleSliceClick` ahora invalida queries antes de actualizar drill
   - Invalidación con queryKey `["drilldown-details"]`

5. `src/features/analytics/sections/AnalyticsByTagSection.tsx`
   - Agregado `useQueryClient`
   - `handleSliceClick` ahora invalida queries antes de actualizar drill
   - Invalidación con queryKey `["drilldown-details"]`

## Validación

✅ TypeScript compilation: **PASSED** (sin errores)
✅ ESLint: **PASSED** (solo warnings no críticos)
✅ Build: **READY** para deployment

## Componentes Afectados

- `AnalyticsByTownSection` ✅
- `AnalyticsByTagSection` ✅
- `ChatbotByTownSection` ✅ (usa el mismo patrón)

---

**Fecha**: 2025-10-14
**Cambios validados**: TypeScript + ESLint + Build
