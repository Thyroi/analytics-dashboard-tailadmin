# 🐛 PÁGINAS DEBUG - WORKFLOW ANALYSIS

## 📋 Información General

- **Rutas**:
  - `/debug` (app/debug/page.tsx)
  - `/debug/categorias` (app/debug/categorias/page.tsx)
  - `/debug/towns` (app/debug/towns/page.tsx)
- **Propósito**: Páginas de testing y depuración para hooks y componentes
- **Layout**: Utilizan layout principal con sidebar y header

## 🔄 Flujo de Negocio

### 1. **Página /debug (Principal)**

- **Función**: Testing del hook `useResumenTown`
- **Características**:
  - Controles de tiempo completos (StickyHeaderSection)
  - Visualización de datos en cards
  - Preview JSON completo del estado del hook
  - Información detallada de debug

### 2. **Página /debug/categorias**

- **Función**: Testing de categorías con contexto TagTimeframe
- **Características**:
  - Usa `TagTimeProvider` para contexto
  - `StickyHeaderSection` con controles
  - `DebugCategoriesSection` para contenido

### 3. **Página /debug/towns**

- **Función**: Testing de towns con contexto TagTimeframe
- **Características**:
  - Usa `TagTimeProvider` para contexto
  - `StickyHeaderSection` con controles
  - `DebugTownsSection` para contenido

## 🎯 Flujo de Usuario

1. Desarrollador accede a páginas debug durante desarrollo
2. Puede probar diferentes granularidades y rangos de fecha
3. Ve datos en tiempo real y estado de hooks
4. Puede debuggear problemas de datos o UI
5. Preview JSON ayuda a entender estructura de datos

## 🔗 Dependencias Directas

- `StickyHeaderSection` (todas las páginas)
- `JsonPreview` (página principal)
- `TagTimeProvider` (categorias y towns)
- `DebugCategoriesSection` (categorias)
- `DebugTownsSection` (towns)
- Varios hooks de datos para testing

## 📊 Tipo de Datos

- Estados de hooks (loading, error, data)
- Parámetros de tiempo y granularidad
- Datos de towns y categorías para testing
- Información de debug detallada
