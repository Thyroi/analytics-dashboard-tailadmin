# 🐛 PÁGINAS DEBUG - COMPONENT TRACING

## 📋 COMPONENTES UTILIZADOS (TRAZADO COMPLETO)

### 🔍 **DIRECTOS** (desde páginas debug)

#### **app/debug/page.tsx**

- ✅ `StickyHeaderSection` - Controles de tiempo
- ✅ `JsonPreview` - Preview del estado JSON

#### **app/debug/categorias/page.tsx**

- ✅ `StickyHeaderSection` - Controles de tiempo
- ✅ `TagTimeProvider` - Provider contexto
- ✅ `DebugCategoriesSection` - Contenido debug categorías

#### **app/debug/towns/page.tsx**

- ✅ `StickyHeaderSection` - Controles de tiempo
- ✅ `TagTimeProvider` - Provider contexto
- ✅ `DebugTownsSection` - Contenido debug towns

### 🎯 **COMPONENTS (desde /components/)**

#### **common/**

- ✅ `StickyHeaderSection` - Header con controles (usado en todas las páginas debug)

#### **debug/**

- ✅ `JsonPreview` - Componente para mostrar JSON formatted (solo en /debug principal)

### 🏗️ **STRUCTURE TRACED**

```
app/debug/page.tsx
├── StickyHeaderSection ✅
└── JsonPreview ✅

app/debug/categorias/page.tsx
├── TagTimeProvider
├── StickyHeaderSection ✅
└── DebugCategoriesSection
    └── [Posibles components internos]

app/debug/towns/page.tsx
├── TagTimeProvider
├── StickyHeaderSection ✅
└── DebugTownsSection
    └── [Posibles components internos]
```

### 📊 **SUMMARY - PÁGINAS DEBUG**

**Total componentes /components/ utilizados: 2**

**common/** (1):

- StickyHeaderSection

**debug/** (1):

- JsonPreview

### ⚠️ **NOTAS CRÍTICAS**

- `JsonPreview` es componente de DEBUG - candidato para eliminación en producción
- `StickyHeaderSection` es reutilizado (no específico de debug)
- Las páginas debug son para DESARROLLO solamente
- `JsonPreview` probablemente solo se usa en estas páginas debug
- DebugCategoriesSection y DebugTownsSection podrían usar más components internamente
