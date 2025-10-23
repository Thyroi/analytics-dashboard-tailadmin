# Sistema de Colores Contrastantes Mejorado

## 🎯 Problema Resuelto

**Antes**: Los colores se asignaban usando un hash del path, lo que podía resultar en colores similares que eran difíciles de distinguir en las gráficas comparativas.

**Ahora**: Los colores se asignan secuencialmente de una paleta curada para máximo contraste visual.

## 🎨 Paleta de Colores

### Colores Primarios (hasta 8 elementos)

1. `#E55338` - Huelva primary (Rojo-Naranja)
2. `#1E40AF` - Blue 800 (Azul profundo)
3. `#059669` - Emerald 600 (Verde)
4. `#7C2D12` - Orange 900 (Marrón)
5. `#6B21A8` - Purple 800 (Morado)
6. `#0F766E` - Teal 700 (Verde azulado)
7. `#BE185D` - Pink 700 (Rosa)
8. `#365314` - Green 900 (Verde oliva)

### Colores Extendidos (más de 8 elementos)

Los colores adicionales continúan con tonos secundarios que mantienen buen contraste.

## ⚡ Funciones Principales

### `getContrastingColors(paths: string[])`

- **Propósito**: Asigna colores secuencialmente para máximo contraste
- **Comportamiento**:
  - Deduplica paths automáticamente
  - Usa paleta primaria para ≤8 elementos
  - Usa paleta extendida para >8 elementos
- **Ejemplo**:
  ```typescript
  const colors = getContrastingColors([
    "/",
    "/sabor/",
    "/municipios-del-condado/",
  ]);
  // Resultado:
  // {
  //   '/': '#E55338',           // Rojo-Naranja (máximo contraste)
  //   '/sabor/': '#1E40AF',     // Azul profundo
  //   '/municipios-del-condado/': '#059669'  // Verde
  // }
  ```

## 🔧 Implementación

### En ComparativeTopPages

- Los colores del chart y las pills usan el mismo sistema
- Se calcula una vez en `useMemo` para eficiencia
- Fallback a `colorForPath` por compatibilidad

### En ApexCharts

```typescript
// Antes
color: colorForPath(s.path);

// Ahora
color: pathColorMap[s.path] || colorForPath(s.path);
```

### En Pills de Selección

```typescript
// Antes
const color = colorForPath(path);

// Ahora
const color = pillColors[path] || colorForPath(path);
```

## ✅ Beneficios

1. **Máximo Contraste**: Los colores están estratégicamente espaciados en el espectro
2. **Consistencia**: Mismos colores en chart y pills
3. **Escalabilidad**: Maneja hasta 16+ elementos con colores únicos
4. **Accesibilidad**: Colores optimizados para legibilidad en dark/light mode
5. **Determinístico**: El mismo conjunto de paths siempre obtiene los mismos colores

## 🧪 Testing

- 11 tests comprensivos cubren todos los casos
- Validación de formato de colores
- Manejo de duplicados
- Contraste visual verificado
- Compatibilidad con sistemas existentes

## 📊 Casos de Uso

### Comparativa de Páginas Top

```
/ (Inicio)           → #E55338 (Rojo-Naranja)
/sabor/              → #1E40AF (Azul profundo)
/municipios-del-condado/ → #059669 (Verde)
/events/             → #7C2D12 (Marrón)
```

Cada página es **inmediatamente distinguible** en la gráfica, mejorando significativamente la experiencia de usuario al comparar múltiples series de datos.
