# 🏠 PÁGINA PRINCIPAL (/) - COMPONENT TRACING

## 📋 COMPONENTES UTILIZADOS (TRAZADO COMPLETO)

### 🔍 **DIRECTOS** (desde app/page.tsx)

- ✅ `HomeProviders` - Provider de contexto
- ✅ `GeneralDataSection` - Sección de datos generales
- ✅ `SectorsByTagSection` - Sección sectores por categorías
- ✅ `SectorsByTownSection` - Sección sectores por municipios

### 🎯 **COMPONENTS (desde /components/)**

#### **common/**

- ✅ `StickyHeaderSection` - Header pegajoso con controles de tiempo
  - Usado en: GeneralDataSection, SectorsByTagSection, SectorsByTownSection
- ✅ `SectorsGrid` - Grid principal de sectores
  - Usado en: SectorsByTagSection, SectorsByTownSection
- ✅ `ChartPair` - Pair de charts para comparaciones
  - Usado en: SectorExpandedCard
- ✅ `DeltaCard` - Card con delta/cambio porcentual
  - Usado en: SectorsGrid (features/home/sectors/SectorsGrid.tsx)

#### **charts/**

- ✅ `LineChart` - Gráfico de líneas
  - Usado en: GeneralDataBody, SectorExpandedCard/ChartSection
- ✅ `DonutLeader` - Gráfico donut con legend
  - Usado en: SectorExpandedCard/DonutSection

### 🏗️ **STRUCTURE TRACED**

```
app/page.tsx
├── HomeProviders
├── GeneralDataSection
│   ├── StickyHeaderSection ✅
│   └── GeneralDataRow
│       └── GeneralDataCard
│           └── GeneralDataCardView
│               ├── GeneralDataHeader
│               └── GeneralDataBody
│                   └── LineChart ✅
├── SectorsByTagSection
│   ├── StickyHeaderSection ✅
│   └── SectorsByTagSectionContent
│       └── SectorsGrid ✅
│           ├── DeltaCard ✅ (if expanded)
│           └── SectorExpandedCard (if expanded)
│               ├── ChartPair ✅
│               ├── DonutSection
│               │   └── DonutLeader ✅
│               └── ChartSection
│                   └── LineChart ✅
└── SectorsByTownSection
    ├── StickyHeaderSection ✅
    └── SectorsByTownSectionContent
        └── SectorsGrid ✅
            ├── DeltaCard ✅ (if expanded)
            └── SectorExpandedCard (if expanded)
                ├── ChartPair ✅
                ├── DonutSection
                │   └── DonutLeader ✅
                └── ChartSection
                    └── LineChart ✅
```

### 📊 **SUMMARY - PÁGINA PRINCIPAL**

**Total componentes /components/ utilizados: 6**

- StickyHeaderSection
- SectorsGrid
- ChartPair
- DeltaCard
- LineChart
- DonutLeader

### ⚠️ **NOTAS IMPORTANTES**

- `DeltaCard` se usa desde `features/home/sectors/SectorsGrid.tsx`
- Todos estos componentes son CRÍTICOS y NO deben eliminarse
- La mayoría se usan en estados expandidos o interactivos
