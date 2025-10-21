# 🏠 PÁGINA PRINCIPAL (/) - WORKFLOW ANALYSIS

## 📋 Información General

- **Ruta**: `/` (app/page.tsx)
- **Propósito**: Dashboard principal con vista general de datos por sectores
- **Layout**: Utiliza layout principal con sidebar y header

## 🔄 Flujo de Negocio

### 1. **Inicialización**

- Renderiza dentro de `HomeProviders` (contexto y providers específicos)
- Layout principal con navegación lateral y header

### 2. **Secciones Principales** (orden de renderizado):

#### A. `GeneralDataSection`

- **Función**: Muestra métricas generales/KPIs principales
- **Ubicación**: `@/features/home/sections/GeneralDataSection`

#### B. `SectorsByTagSection`

- **Función**: Análisis de sectores agrupados por tags/categorías
- **Ubicación**: `@/features/home/sections/SectorsByTagSection`

#### C. `SectorsByTownSection`

- **Función**: Análisis de sectores agrupados por ciudades/pueblos
- **Ubicación**: `@/features/home/sections/SectorsByTownSection`

## 🎯 Flujo de Usuario

1. Usuario accede a la página principal
2. Ve overview general de métricas (GeneralDataSection)
3. Puede explorar datos por categorías (SectorsByTagSection)
4. Puede explorar datos por localización (SectorsByTownSection)
5. Cada sección permite drill-down a detalles específicos

## 🔗 Dependencias Directas

- `HomeProviders` (contexto/state management)
- `GeneralDataSection` (métricas generales)
- `SectorsByTagSection` (análisis por tags)
- `SectorsByTownSection` (análisis por towns)

## 📊 Tipo de Datos

- Métricas agregadas de sectores
- Datos geográficos (por ciudad/pueblo)
- Datos categóricos (por tags)
- Visualizaciones: charts, grids, mapas
