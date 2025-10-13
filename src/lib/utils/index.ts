/**
 * Índice Principal de Utilidades Organizadas
 * Sistema de utilidades reorganizado por contexto funcional
 *
 * ORGANIZACIÓN:
 * - analytics/: Funcionalidades de Google Analytics 4
 * - time/: Funciones de fecha, tiempo y rangos temporales
 * - data/: Procesamiento de datos, series y gráficos
 * - routing/: URLs, rutas y navegación
 * - formatting/: Formateo, colores y presentación
 * - core/: Funcionalidades transversales del sistema
 */

// =================== ANALYTICS ===================
// Google Analytics 4, autenticación y manejo de errores
export * as Analytics from "./analytics";

// =================== TIME ===================
// Fechas, rangos temporales y granularidad
export * as Time from "./time";

// =================== DATA ===================
// Procesamiento de datos, series y gráficos
export * as Data from "./data";

// =================== ROUTING ===================
// URLs, paths y navegación
export * as Routing from "./routing";

// =================== FORMATTING ===================
// Formateo, colores y presentación
export * as Formatting from "./formatting";

// =================== CORE ===================
// Funcionalidades centrales y transversales
export * as Core from "./core";

/*
MIGRATION GUIDE - Como migrar imports:

ANTES:
import { someFunction } from "@/lib/utils/someFile"

DESPUÉS:
import { Analytics, Time, Data, Routing, Formatting, Core } from "@/lib/utils"
// O importación específica:
import { someFunction } from "@/lib/utils/analytics/someFile"

EJEMPLOS DE USO:
- Analytics.createGA4Client()
- Time.parseISO()
- Data.buildSeries()
- Routing.normalizePath()
- Formatting.formatNumber()
- Core.calculateDelta()
*/
