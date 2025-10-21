# 📊 PÁGINA ANALYTICS - WORKFLOW ANALYSIS

## 📋 Información General

- **Ruta**: `/analytics` (app/(dashboard)/analytics/page.tsx)
- **Propósito**: Dashboard principal de analíticas GA4 con KPIs, demografía y métricas detalladas
- **Layout**: Utiliza layout de dashboard con sidebar y header

## 🔄 Flujo de Negocio

### 1. **Inicialización**

- Renderiza dentro de `AnalyticsProviders` + `HeaderAnalyticsTimeProvider`
- Control de tiempo centralizando con contexto compartido
- Suspense boundary para lazy loading

### 2. **Secciones Principales** (orden de renderizado):

#### A. **Header + Controls**

- `StickyHeaderSection` - Control de granularidad y rangos de fecha

#### B. **KPIs Section**

- `AnalyticsKPISection` - Grid responsive de KPIs principales
- Grid auto-fit con min-width 221px

#### C. **Métricas Triples** (grid md:grid-cols-3)

- `UserAcquisitionSection` - Adquisición de usuarios
- `DevicesOsSection` - Distribución de SO
- `DeviceDonutSection` - Distribución de dispositivos

#### D. **Demografía**

- `CustomersDemographicsSection` - Datos demográficos/geográficos

#### E. **Sectores Analytics** (space-y-3)

- `AnalyticsByTagSection` - Analytics por categorías
- `AnalyticsByTownSection` - Analytics por municipios

## 🎯 Flujo de Usuario

1. Usuario accede a `/analytics`
2. Ve header con controles de tiempo (sticky)
3. Revisa KPIs principales en grid responsive
4. Analiza adquisición, dispositivos y SO en paralelo
5. Explora demografía geográfica detallada
6. Drill-down en sectores por categorías y municipios

## 🔗 Dependencias Directas

- `AnalyticsProviders` (contexto analytics)
- `HeaderAnalyticsTimeProvider` (contexto tiempo)
- `StickyHeaderSection` (controles tiempo)
- `AnalyticsKPISection` (KPIs grid)
- `UserAcquisitionSection` (adquisición)
- `DevicesOsSection` (SO distribución)
- `DeviceDonutSection` (dispositivos)
- `CustomersDemographicsSection` (demografía)
- `AnalyticsByTagSection` (sectores por tags)
- `AnalyticsByTownSection` (sectores por towns)

## 📊 Tipo de Datos

- KPIs de Google Analytics 4
- Datos demográficos y geográficos
- Métricas de dispositivos y adquisición
- Analytics por sectores y localización
- Visualizaciones: líneas, donuts, mapas, grids
