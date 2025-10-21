# 📊 PÁGINA ANALYTICS - COMPONENT TRACING

## 📋 COMPONENTES UTILIZADOS (TRAZADO COMPLETO)

### 🔍 **DIRECTOS** (desde app/(dashboard)/analytics/page.tsx)

- ✅ `AnalyticsProviders` - Provider contexto analytics
- ✅ `HeaderAnalyticsTimeProvider` - Provider tiempo compartido
- ✅ `StickyHeaderSection` - Header con controles tiempo
- ✅ `AnalyticsKPISection` - Grid KPIs principales
- ✅ `UserAcquisitionSection` - Sección adquisición usuarios
- ✅ `DevicesOsSection` - Sección distribución SO
- ✅ `DeviceDonutSection` - Sección dispositivos donut
- ✅ `CustomersDemographicsSection` - Sección demografía
- ✅ `AnalyticsByTagSection` - Analytics por categorías
- ✅ `AnalyticsByTownSection` - Analytics por municipios

### 🎯 **COMPONENTS (desde /components/)**

#### **common/**

- ✅ `StickyHeaderSection` - Header pegajoso (usado directo + en secciones)
- ✅ `SectorsGrid` - Grid sectores (AnalyticsByTagSection, AnalyticsByTownSection)
- ✅ `ChartPair` - Par de charts (SectorExpandedCardDetailed, TownCategoryDrilldownPanel)
- ✅ `DeltaCard` - Card delta (SectorsGridDetailed)
- ✅ `Header` - Header común (múltiples secciones y componentes)

#### **dashboard/**

- ✅ `KPIStatGrid` - Grid de KPIs estadísticas (AnalyticsKPISection)
- ✅ `DonutCard` - Card con donut (DeviceDonutSection, DevicesOsDonutSection)
- ✅ `CustomersDemographics` - Componente demografía (CustomersDemographicsSection)
- ✅ `RangeControls` - Controles de rango (StickyHeaderSection analytics)

#### **charts/**

- ✅ `LineChart` - Gráfico líneas (UserAcquisitionSection, TopPagesRangeSection, DrilldownMultiLineSection)
- ✅ `KPIList` - Lista KPIs (UrlDetailsPanel, KPIColumnWithTrend)
- ✅ `WorldBubbleMap` - Mapa burbujas (tipos en demographics)

#### **skeletons/**

- ✅ `KPIListSkeleton` - Skeleton KPIList (UrlDetailsPanelSkeleton, KPIColumnWithTrend, UrlDetailsPanel)
- ✅ `ChartPairSkeleton` - Skeleton ChartPair (TownCategoryDrilldownPanel)

### 🏗️ **STRUCTURE TRACED (SIMPLIFIED)**

```
app/(dashboard)/analytics/page.tsx
├── StickyHeaderSection ✅
├── AnalyticsKPISection
│   └── KPIStatGrid ✅
├── UserAcquisitionSection
│   ├── LineChart ✅
│   └── Header ✅
├── DevicesOsSection
│   └── DonutCard ✅
├── DeviceDonutSection
│   └── DonutCard ✅
├── CustomersDemographicsSection
│   ├── CustomersDemographics ✅
│   └── WorldBubbleMap ✅ (tipos)
├── AnalyticsByTagSection
│   ├── StickyHeaderSection ✅
│   └── SectorsGrid ✅
│       ├── DeltaCard ✅ (expanded)
│       └── SectorExpandedCardDetailed (expanded)
│           ├── ChartPair ✅
│           ├── DrilldownMultiLineSection
│           │   └── LineChart ✅
│           ├── KPIColumnWithTrend
│           │   ├── KPIList ✅
│           │   └── KPIListSkeleton ✅
│           ├── UrlDetailsPanel
│           │   ├── KPIList ✅
│           │   ├── Header ✅
│           │   └── KPIListSkeleton ✅
│           ├── TownCategoryDrilldownPanel
│           │   ├── ChartPair ✅
│           │   └── ChartPairSkeleton ✅
│           └── StickyHeaderSection
│               ├── Header ✅
│               └── RangeControls ✅
└── AnalyticsByTownSection
    ├── StickyHeaderSection ✅
    └── SectorsGrid ✅
        ├── DeltaCard ✅ (expanded)
        └── [Same expanded structure as above]
```

### 📊 **SUMMARY - PÁGINA ANALYTICS**

**Total componentes /components/ utilizados: 12**

**common/** (5):

- StickyHeaderSection, SectorsGrid, ChartPair, DeltaCard, Header

**dashboard/** (4):

- KPIStatGrid, DonutCard, CustomersDemographics, RangeControls

**charts/** (3):

- LineChart, KPIList, WorldBubbleMap

**skeletons/** (2):

- KPIListSkeleton, ChartPairSkeleton

### ⚠️ **NOTAS CRÍTICAS**

- Todos estos componentes son CRÍTICOS para analytics
- Muchos se usan en estados expandidos/drill-down
- Skeletons necesarios para UX durante carga
- CustomersDemographics y WorldBubbleMap son componentes complejos
