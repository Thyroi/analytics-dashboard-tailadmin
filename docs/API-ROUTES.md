# 📡 API Routes Documentation

**Proyecto:** Analytics Dashboard TailAdmin
**Última actualización:** Octubre 30, 2025

---

## 🔐 Seguridad y Autenticación

### Estado Actual

- **Middleware de autenticación:** Solo protege páginas (`/analytics`, `/auth`), NO protege APIs
- **APIs públicas:** Todas las rutas `/api/*` son accesibles sin autenticación
- **Autenticación disponible:** Auth0 + Login local híbrido

### ⚠️ Recomendaciones de Seguridad

1. **APIs sensibles** deberían verificar sesión del usuario
2. Considerar rate limiting para prevenir abuso
3. Validar origen de requests (CORS) si es necesario
4. Agregar middleware de autenticación para `/api/analytics/*` si se requiere

---

## 📊 Analytics API v1

### Rutas de Header/Dashboard

#### `GET /api/analytics/v1/header/kpis`

- **Descripción:** KPIs principales del dashboard (vistas, engagement, usuarios, sesiones)
- **Query params:** `granularity`, `startDate`, `endDate`
- **Response:** KPIs con totales current/previous y deltas
- **Tamaño:** 21 líneas ⚡

#### `GET /api/analytics/v1/header/countries`

- **Descripción:** Top países por visitas
- **Query params:** Fecha range
- **Response:** Lista de países con totales
- **Tamaño:** 19 líneas ⚡

#### `GET /api/analytics/v1/header/countries/[country]/regions`

- **Descripción:** Regiones de un país específico
- **Path params:** `country`
- **Response:** Lista de regiones

#### `GET /api/analytics/v1/header/countries/[country]/regions/[region]/cities`

- **Descripción:** Ciudades de una región específica
- **Path params:** `country`, `region`
- **Response:** Lista de ciudades

#### `GET /api/analytics/v1/header/gender`

- **Descripción:** Distribución por género
- **Query params:** Fecha range
- **Response:** Totales por género
- **Tamaño:** 34 líneas ⚡

#### `GET /api/analytics/v1/header/devices/os`

- **Descripción:** Distribución por sistema operativo
- **Query params:** Fecha range
- **Response:** Totales por OS
- **Tamaño:** 18 líneas ⚡

#### `GET /api/analytics/v1/header/user-acquisition-range`

- **Descripción:** Adquisición de usuarios en rango
- **Query params:** `granularity`, `startDate`, `endDate`
- **Response:** Series temporal de nuevos usuarios
- **Tamaño:** 18 líneas ⚡

#### `GET /api/analytics/v1/header/top-pages-range`

- **Descripción:** Top páginas en rango temporal
- **Query params:** `granularity`, `startDate`, `endDate`
- **Response:** Series temporal de páginas más vistas
- **Tamaño:** 17 líneas ⚡

---

### Rutas de Datos Principales

#### `GET /api/analytics/v1/overview`

- **Descripción:** Vista general del dashboard
- **Query params:** `granularity`, `startDate`, `endDate`
- **Response:** Datos agregados del overview
- **Tamaño:** 19 líneas ⚡

#### `GET /api/analytics/v1/devices`

- **Descripción:** Distribución por dispositivos (mobile/desktop/tablet)
- **Query params:** Fecha range
- **Response:** Donut data por tipo de dispositivo
- **Tamaño:** 25 líneas ⚡

#### `GET /api/analytics/v1/top-pages-table`

- **Descripción:** Tabla de top páginas con métricas detalladas
- **Query params:** `granularity`, `startDate`, `endDate`
- **Response:** Array de páginas con vistas, engagement, bounce, etc.
- **Tamaño:** 260 líneas 🟡
- **Complejidad:** Media-alta, lógica de agregación compleja

#### `GET /api/analytics/v1/top-comparative-pages-fixed`

- **Descripción:** Comparativa de top páginas entre periodos
- **Query params:** `granularity`, `startDate`, `endDate`
- **Response:** Datos comparativos con deltas
- **Tamaño:** 235 líneas 🟡
- **Complejidad:** Media, múltiples queries GA4

---

### Rutas de Dimensions (Categorías y Pueblos)

#### `GET /api/analytics/v1/dimensions/categorias/totales`

- **Descripción:** Totales agregados por categoría
- **Query params:** `granularity`, `startDate`, `endDate`
- **Response:** Array de categorías con totales y deltas
- **Tamaño:** 143 líneas 🟡
- **Uso:** Página de chatbot

#### `GET /api/analytics/v1/dimensions/categorias/details/[id]`

- **Descripción:** Detalles de una categoría específica
- **Path params:** `id` (categoria)
- **Query params:** `granularity`, `startDate`, `endDate`
- **Response:** Series temporal y breakdown de la categoría
- **Uso:** Cards expandidas de categorías

#### `GET /api/analytics/v1/dimensions/pueblos/totales`

- **Descripción:** Totales agregados por pueblo
- **Query params:** `granularity`, `startDate`, `endDate`
- **Response:** Array de pueblos con totales y deltas
- **Tamaño:** 142 líneas 🟡
- **Uso:** Página de chatbot

#### `GET /api/analytics/v1/dimensions/pueblos/details/[id]`

- **Descripción:** Detalles de un pueblo específico
- **Path params:** `id` (pueblo)
- **Query params:** `granularity`, `startDate`, `endDate`
- **Response:** Series temporal y breakdown del pueblo
- **Uso:** Cards expandidas de pueblos

---

### Rutas de Drilldown

#### `GET /api/analytics/v1/drilldown/url`

- **Descripción:** Análisis detallado de una URL específica (drilldown profundo)
- **Query params:**
  - `path` (required): URL completa a analizar
  - `granularity`: d/w/m/y
  - `startDate`, `endDate`: Rango personalizado
- **Response:**
  - Series temporales (engagement, vistas)
  - KPIs (vistas, engagement, bounce rate, avg time)
  - Donuts (por pueblo, categoría)
  - Totales current vs previous con deltas
- **Tamaño:** 368 líneas 🔴
- **Complejidad:** ALTA
- **Características:**
  - Construcción de axis lagged/custom
  - Múltiples queries paralelas a GA4
  - Procesamiento complejo de dimensiones custom
  - Cálculo de series con buckets temporales
- **Performance:** Usa Promise.all para paralelizar queries
- **Estado:** ✅ Bien optimizado, usa helpers compartidos
- **Uso:** Cards expandidas de URLs en analytics

---

## 🤖 Chatbot API

#### `GET /api/chatbot/audit/tags`

- **Descripción:** Auditoría de tags del sistema
- **Query params:** Fecha range, filtros
- **Response:** Lista de tags con metadata
- **Tamaño:** 154 líneas 🟡
- **Uso:** MUY USADO (11+ referencias en servicios)

#### `POST /api/chatbot/audit/tags`

- **Descripción:** Crear/actualizar tags de auditoría
- **Body:** Tag data
- **Response:** Tag creado/actualizado
- **Tamaño:** Incluido en archivo anterior

#### `POST /api/chatbot/top-categories`

- **Descripción:** Top categorías del chatbot
- **Body:** Parámetros de consulta
- **Response:** Ranking de categorías
- **Tamaño:** 57 líneas ⚡
- **Estado:** ⚠️ Posiblemente no usado (no encontradas referencias)

---

## 🔐 Auth API

#### `POST /api/auth/local/login`

- **Descripción:** Login con credenciales locales (hybrid auth)
- **Body:** `{ email, password }`
- **Response:** Session cookie + user data
- **Tamaño:** 53 líneas ⚡
- **Seguridad:** ✅ Usa bcrypt, valida credenciales con Prisma

#### `POST /api/auth/local/logout`

- **Descripción:** Logout de sesión local
- **Response:** Success message
- **Tamaño:** 13 líneas ⚡

---

## 🔄 tRPC API

#### `/api/trpc/[trpc]`

- **Descripción:** Handler de tRPC para procedures del servidor
- **Tipo:** Dynamic route
- **Uso:** Admin operations (listUsers, setUserRole, deleteUser)
- **Autenticación:** Verifica roles en procedures

---

## 📏 Estadísticas de APIs

### Por Tamaño

| Categoría                     | Cantidad | Archivos                                 |
| ----------------------------- | -------- | ---------------------------------------- |
| **Pequeñas (<50 líneas)**     | 10       | kpis, overview, countries, devices, etc. |
| **Medianas (50-150 líneas)**  | 5        | audit/tags, totales (categorias/pueblos) |
| **Grandes (150-300 líneas)**  | 2        | top-pages-table, top-comparative-pages   |
| **Muy Grandes (>300 líneas)** | 1        | drilldown/url                            |

### Por Uso

| Estado                     | Cantidad | Notas                  |
| -------------------------- | -------- | ---------------------- |
| **Activas**                | 17       | Usadas en producción   |
| **Posiblemente no usadas** | 1        | chatbot/top-categories |
| **Test/Debug**             | 0        | No hay APIs de debug   |

---

## 🎯 Recomendaciones

### Prioridad ALTA 🔴

1. **Implementar autenticación en APIs sensibles**

   - Todas las APIs de analytics deberían verificar sesión
   - Proteger APIs de admin (tRPC ya lo hace)

2. **Implementar rate limiting**
   - Especialmente para drilldown/url (query compleja)
   - Prevenir abuso de APIs públicas

### Prioridad MEDIA 🟡

3. **Optimizar top-pages-table (260 líneas)**

   - Considerar extraer lógica de agregación a helper
   - Posible paginación si dataset crece

4. **Verificar uso de chatbot/top-categories**

   - Si no se usa, considerar eliminar
   - Si se usa, documentar mejor

5. **Agregar logging/monitoring**
   - Tiempos de respuesta
   - Errores y excepciones
   - Usage patterns

### Prioridad BAJA 🟢

6. **Documentación inline**

   - Agregar JSDoc a funciones principales
   - Documentar query params esperados

7. **Tests de integración**
   - Expandir cobertura de tests para APIs
   - Validar edge cases

---

## ✅ Estado General

**Las APIs están en BUEN ESTADO:**

- ✅ Código limpio y bien estructurado
- ✅ Usan helpers compartidos
- ✅ Lógica compleja bien encapsulada
- ✅ Performance optimizado con Promise.all
- ⚠️ Falta protección por autenticación
- ⚠️ Falta rate limiting

**No se requiere refactorización urgente de código.**
**Prioridad:** Mejorar seguridad y monitoring.
