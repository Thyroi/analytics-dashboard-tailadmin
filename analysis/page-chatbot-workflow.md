# 🤖 PÁGINA CHATBOT - WORKFLOW ANALYSIS

## 📋 Información General

- **Ruta**: `/chatbot` (app/(dashboard)/chatbot/page.tsx)
- **Propósito**: Dashboard de análisis de interacciones del chatbot por categorías y municipios
- **Layout**: Utiliza layout de dashboard con sidebar y header

## 🔄 Flujo de Negocio

### 1. **Estado Principal (Overview Mode)**

- Muestra vista general de categorías y municipios
- Permite selección para drill-down

### 2. **Secciones Principales** (en modo overview):

#### A. `ChatbotCategoriesSection`

- **Función**: Grid/lista de categorías de chatbot con métricas
- **Ubicación**: `@/features/chatbot/components/ChatbotCategoriesSection`
- Incluye sticky header con controles

#### B. `ChatbotTownsSection`

- **Función**: Grid/lista de municipios con métricas de chatbot
- **Ubicación**: `@/features/chatbot/components/ChatbotTownsSection`
- Incluye sticky header con controles

### 3. **Estado Drill-down**

- Cuando se selecciona una categoría, cambia a `CategoryDrilldownView`
- **Función**: Vista detallada de categoría específica con subcategorías y análisis temporal

## 🎯 Flujo de Usuario

1. Usuario accede a `/chatbot`
2. Ve overview de categorías (ChatbotCategoriesSection)
3. Ve overview de municipios (ChatbotTownsSection)
4. Puede hacer clic en categoría para drill-down
5. En drill-down ve análisis detallado de la categoría
6. Puede volver al overview con botón "back"

## 🔗 Dependencias Directas

- `ChatbotCategoriesSection` (grid categorías)
- `ChatbotTownsSection` (grid municipios)
- `CategoryDrilldownView` (vista detallada categoría)

## 📊 Tipo de Datos

- Métricas de interacciones del chatbot
- Datos por categorías y subcategorías
- Datos geográficos (por municipio)
- Análisis temporal de interacciones
- Visualizaciones: grids, charts, drill-down views
