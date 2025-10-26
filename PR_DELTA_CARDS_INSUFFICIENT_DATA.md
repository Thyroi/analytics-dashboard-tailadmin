# PR: Deshabilitar DeltaCards con datos insuficientes

## 📋 Resumen

Mejora la UX de las `DeltaCard` deshabilitando la interacción en tarjetas sin datos suficientes, diferenciando entre "sin datos" y "sin cambios" (0.0%).

## 🎯 Problema

Anteriormente, todas las tarjetas eran clickeables independientemente de si tenían datos o no. Esto causaba confusión cuando el usuario hacía click en tarjetas que mostraban "Sin datos suficientes" y no obtenían información útil.

## ✨ Solución

### Cambios en `DeltaCard`

**Lógica de deshabilitación:**
- ✅ Cards con `deltaArtifact.state === "zero_vs_zero"` → **No clickeable** (0 vs 0, sin datos en ambos períodos)
- ✅ Cards con `deltaArtifact.state === "no_current"` → **No clickeable** (sin datos actuales)
- ✅ Cards con `deltaArtifact.state === "ok"` y `deltaPct = 0` → **Clickeable** (datos válidos pero sin cambio = 0.0%)
- ✅ Cards con `deltaArtifact.state === "new_vs_zero"` → **Clickeable** (datos nuevos)
- ✅ Cards con `deltaArtifact.state === "no_prev"` → **Clickeable** (datos actuales pero sin previos)

**Cambios visuales:**
- **Cursor:** `cursor-default` (normal, no prohibido) cuando hay datos insuficientes
- **Opacidad:** `opacity-60` para indicar estado deshabilitado
- **Hover:** Sin efectos de animación o hover cuando está deshabilitada
- **Tooltip:** Muestra "No hay datos suficientes para mostrar detalles" al hacer hover

## 🔍 Comportamiento esperado

### Cards deshabilitadas (sin datos)
```typescript
// Ejemplo: zero_vs_zero
{
  deltaArtifact: {
    state: "zero_vs_zero",
    deltaPct: 0,
    deltaAbs: 0,
    baseInfo: { current: 0, prev: 0 }
  }
}
```
- ❌ No responde al click
- 🖱️ Cursor normal (no pointer)
- 🎨 Opacidad reducida (60%)
- 💬 Tooltip: "No hay datos suficientes para mostrar detalles"
- ⏹️ Sin animaciones de hover

### Cards habilitadas (con datos pero sin cambio)
```typescript
// Ejemplo: ok con deltaPct = 0
{
  deltaArtifact: {
    state: "ok",
    deltaPct: 0,
    deltaAbs: 0,
    baseInfo: { current: 100, prev: 100 }
  }
}
```
- ✅ Clickeable normalmente
- 🖱️ Cursor pointer
- 🎨 Opacidad normal (100%)
- 💬 Tooltip: Nombre de la categoría/pueblo
- ✨ Animaciones de hover activas

## 📁 Archivos modificados

- `src/components/common/DeltaCard/index.tsx`

## 🧪 Testing

### Manual
1. Navegar a página Home, Analytics o Chatbot
2. Verificar que cards con "Sin datos suficientes":
   - No responden al click
   - Muestran tooltip informativo
   - Tienen apariencia visual deshabilitada
3. Verificar que cards con "0.0%" (pero con datos) siguen siendo clickeables

### Estados a probar
- [ ] `zero_vs_zero`: Card completamente deshabilitada
- [ ] `no_current`: Card deshabilitada
- [ ] `ok` con `deltaPct = 0`: Card habilitada mostrando "0.0%"
- [ ] `new_vs_zero`: Card habilitada mostrando "Nuevo"
- [ ] `no_prev`: Card habilitada

## 🎨 Capturas

**Antes:**
- Todas las cards clickeables
- Sin diferenciación visual entre "sin datos" y "sin cambios"

**Después:**
- Cards sin datos: opacidad 60%, cursor-default, tooltip informativo
- Cards con cambio 0%: completamente funcionales
- UX más clara y predecible

## ✅ Checklist

- [x] Código implementado
- [x] Lógica de deshabilitación correcta
- [x] Estilos y animaciones ajustados
- [x] Tooltip informativo agregado
- [ ] Testing manual completado
- [ ] Sin regresiones en otras páginas

## 📝 Notas adicionales

Esta mejora es parte del sistema de `deltaArtifact` que proporciona 6 estados explícitos para manejar todos los casos de comparación de datos. La lógica es extensible y puede ajustarse fácilmente si se necesitan más condiciones en el futuro.

## 🔗 Related Issues

- Mejora de UX en DeltaCards
- Sistema de estados de delta robusto
- Diferenciación entre "sin datos" y "sin cambios"
