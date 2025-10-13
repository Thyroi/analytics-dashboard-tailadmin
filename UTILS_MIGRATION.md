# 🚀 Guía de Migración - Reorganización de Utils

## 📋 Resumen de Cambios

Se ha reorganizado la carpeta `src/lib/utils/` para eliminar código duplicado y organizar por contexto funcional.

### 🗂️ Nueva Estructura

```
src/lib/utils/
├── analytics/          # Google Analytics 4
│   ├── auth.ts         # Autenticación GA4 (consolidado)
│   ├── ga4.ts          # Cliente GA4 principal
│   ├── error-handler.ts # Manejo robusto de errores GA4
│   ├── analytics-queries.ts
│   ├── analytics-validators.ts
│   ├── ga.ts
│   ├── ga4Requests.ts
│   └── index.ts
├── time/               # Fechas y tiempo
│   ├── datetime.ts     # Funciones datetime (consolidado)
│   ├── timeWindows.ts
│   ├── timeAxis.ts
│   ├── timeAxisChatbot.ts
│   ├── granularityRanges.ts
│   ├── dateRangeWindow.ts
│   └── index.ts
├── data/               # Procesamiento de datos
│   ├── charts.ts
│   ├── seriesAndDonuts.ts
│   ├── aggregateCategories.ts
│   ├── seriesAndDonuts.test.ts
│   └── index.ts
├── routing/            # URLs y navegación
│   ├── url.ts
│   ├── pathMatching.ts
│   └── index.ts
├── formatting/         # Formateo y presentación
│   ├── format.ts
│   ├── colors.ts
│   └── index.ts
├── core/               # Funcionalidades centrales
│   ├── http.ts
│   ├── delta.ts
│   ├── images.ts
│   ├── sector.ts
│   ├── drilldown.ts
│   ├── granularityMapping.ts
│   ├── windowPolicy.ts
│   ├── windowPolicyAnalytics.ts
│   └── index.ts
└── index.ts            # Índice principal
```

## 📦 Mapeo de Archivos (Antes → Después)

### ✅ Archivos Consolidados (eliminadas duplicaciones)

| Archivo Original       | Nuevo Destino                | Cambios                                    |
| ---------------------- | ---------------------------- | ------------------------------------------ |
| `datetime.ts`          | `time/datetime.ts`           | ✅ Consolidado                             |
| `timeAxis.ts`          | `time/timeAxis.ts`           | ❌ Funciones datetime duplicadas removidas |
| `timeAxisChatbot.ts`   | `time/timeAxisChatbot.ts`    | ❌ Funciones datetime duplicadas removidas |
| `ga.ts`                | `analytics/ga.ts`            | ❌ Auth duplicado removido                 |
| `ga4.ts`               | `analytics/ga4.ts`           | ❌ Auth duplicado removido                 |
| `ga4-error-handler.ts` | `analytics/error-handler.ts` | ✅ Mejorado y consolidado                  |

### 🔄 Archivos Movidos (sin cambios)

| Archivo Original           | Nuevo Destino                       |
| -------------------------- | ----------------------------------- |
| `seriesAndDonuts.ts`       | `data/seriesAndDonuts.ts`           |
| `aggregateCategories.ts`   | `data/aggregateCategories.ts`       |
| `charts.ts`                | `data/charts.ts`                    |
| `url.ts`                   | `routing/url.ts`                    |
| `pathMatching.ts`          | `routing/pathMatching.ts`           |
| `format.ts`                | `formatting/format.ts`              |
| `colors.ts`                | `formatting/colors.ts`              |
| `http.ts`                  | `core/http.ts`                      |
| `delta.ts`                 | `core/delta.ts`                     |
| `images.ts`                | `core/images.ts`                    |
| `sector.ts`                | `core/sector.ts`                    |
| `drilldown.ts`             | `core/drilldown.ts`                 |
| `granularityMapping.ts`    | `core/granularityMapping.ts`        |
| `windowPolicy.ts`          | `core/windowPolicy.ts`              |
| `windowPolicyAnalytics.ts` | `core/windowPolicyAnalytics.ts`     |
| `timeWindows.ts`           | `time/timeWindows.ts`               |
| `granularityRanges.ts`     | `time/granularityRanges.ts`         |
| `dateRangeWindow.ts`       | `time/dateRangeWindow.ts`           |
| `analytics-queries.ts`     | `analytics/analytics-queries.ts`    |
| `analytics-validators.ts`  | `analytics/analytics-validators.ts` |
| `ga4Requests.ts`           | `analytics/ga4Requests.ts`          |

## 🚀 Como Migrar tus Imports

### Opción 1: Importación por Namespace (Recomendado)

```typescript
// ANTES
import { parseISO, toISO } from "@/lib/utils/datetime";
import { normalizePath } from "@/lib/utils/url";
import { createGA4Client } from "@/lib/utils/ga4";

// DESPUÉS
import { Time, Routing, Analytics } from "@/lib/utils";

const date = Time.parseISO("2024-01-01");
const path = Routing.normalizePath("/some/path");
const client = Analytics.createGA4Client(auth);
```

### Opción 2: Importación Directa

```typescript
// ANTES
import { parseISO, toISO } from "@/lib/utils/datetime";
import { normalizePath } from "@/lib/utils/url";

// DESPUÉS
import { parseISO, toISO } from "@/lib/utils/time/datetime";
import { normalizePath } from "@/lib/utils/routing/url";
```

### Opción 3: Importación por Categoría

```typescript
// ANTES
import { parseISO, addDaysUTC, buildTimeAxis } from "@/lib/utils/datetime";

// DESPUÉS
import * as Time from "@/lib/utils/time";

const date = Time.parseISO("2024-01-01");
const newDate = Time.addDaysUTC(date, 7);
```

## 🛠️ Archivos que Necesitan Actualización

Los siguientes tipos de archivos necesitarán actualizar sus imports:

1. **Componentes React** (`src/components/**/*.tsx`)
2. **Features** (`src/features/**/*.ts`)
3. **API Routes** (`src/app/api/**/*.ts`)
4. **Tests** (`__tests__/**/*.ts`, `**/*.test.ts`)
5. **Hooks** (`src/lib/hooks/**/*.ts`)

## ✨ Beneficios de la Nueva Organización

1. **✅ Eliminación de código duplicado**

   - Funciones datetime consolidadas en `time/datetime.ts`
   - Autenticación GA4 unificada en `analytics/auth.ts`
   - Manejo de errores mejorado en `analytics/error-handler.ts`

2. **🗂️ Organización por contexto**

   - Funcionalidades relacionadas agrupadas lógicamente
   - Fácil localización de utilidades específicas
   - Imports más claros y descriptivos

3. **🚀 Mejor mantenibilidad**

   - Cada carpeta tiene responsabilidad específica
   - Archivos index para exportaciones organizadas
   - Documentación clara de cada módulo

4. **📦 Imports más limpios**
   - Namespaces descriptivos (`Analytics`, `Time`, etc.)
   - Evita importaciones largas y confusas
   - Mejor IntelliSense y autocompletado

## 🔍 Verificación Post-Migración

Ejecutar para verificar que no hay errores:

```bash
npm run type-check
npm run lint
npm run test
```

## 📝 Notas Importantes

- Los archivos `index.ts` exportan las funciones principales de cada categoría
- Se mantiene compatibilidad con imports directos si es necesario
- Los tests se movieron junto con sus archivos correspondientes
- La funcionalidad se mantiene 100% intacta, solo cambia la organización
