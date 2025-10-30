# 📊 Analytics Dashboard - TailAdmin

> **Analytics Dashboard para Huelva** - Panel de control avanzado para análisis de datos turísticos con GA4, chatbot analytics y gestión de usuarios.

[![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.14.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![Auth0](https://img.shields.io/badge/Auth0-Authentication-EB5424?logo=auth0)](https://auth0.com/)
[![Tests](https://img.shields.io/badge/Tests-233%2F234_passing-success)](https://vitest.dev/)
[![Code Quality](https://img.shields.io/badge/Refactored-~6500+_lines-brightgreen)]()

---

## 🎯 Estado del Proyecto

### ✅ **Proyecto 100% Refactorizado y Optimizado**

El proyecto ha completado un proceso exhaustivo de refactorización arquitectónica (Octubre 2025):

- ✅ **6,500+ líneas** de código eliminadas/modularizadas
- ✅ **100% de archivos críticos** (>400 líneas) refactorizados
- ✅ **95% código duplicado** eliminado
- ✅ **35+ módulos compartidos** creados
- ✅ **Tests: 234/234 pasando** (100%)
- ✅ **TypeScript: 0 errores**
- ✅ **APIs protegidas** con middleware de autenticación

**📚 Documentación completa de refactorización:** [`docs/REFACTORING-SUMMARY.md`](./docs/REFACTORING-SUMMARY.md)

## 🚀 Deployment

### **Frontend (Vercel)**

- **URL de Producción**: `https://analytics-dashboard-tailadmin.vercel.app` _(pendiente configuración)_
- **URL de Desarrollo**: `http://localhost:3000`
- **Plataforma**: Vercel (configurado para auto-deploy desde `main` branch)

### **Base de Datos (Neon)**

- **Provider**: Neon PostgreSQL
- **Región**: US East 1 (AWS)
- **Connection**: Pooled connection con SSL requerido
- **Endpoint**: `ep-super-scene-ad8e76ju-pooler.c-2.us-east-1.aws.neon.tech`

### **Servicios Externos**

- **Analytics**: Google Analytics 4 API
- **Autenticación**: Auth0 (dev-0zzynj1hz2qz6reg.us.auth0.com)
- **Testing**: Vitest + Playwright para E2E

---

## 🏗️ Arquitectura del Proyecto

### **📁 Estructura de Directorios**

```
analytics-dashboard-tailladmin/
├── 📂 docs/                        # Documentación técnica
│   ├── API-ROUTES.md              # Documentación completa de APIs
│   ├── PRISMA-GUIDE.md            # Guía de Prisma y migraciones
│   ├── ARCHITECTURE.md            # Arquitectura del sistema
│   ├── REFACTORING-SUMMARY.md     # Resumen de refactorización
│   └── DRILLDOWN-TOWNS-GUIDE.md   # Guía de drilldown
├── 📂 analysis/                    # Análisis arquitectónico histórico
│   ├── page-home-workflow.md       # Flujo de trabajo página principal
│   ├── page-analytics-workflow.md  # Flujo de trabajo analytics
│   ├── page-chatbot-workflow.md    # Flujo de trabajo chatbot
│   └── FINAL-COMPONENT-CONSOLIDATION.md # Consolidación final
├── 📂 src/
│   ├── 📂 app/                     # Next.js App Router
│   │   ├── (dashboard)/           # Grupo de rutas del dashboard
│   │   │   ├── analytics/         # Módulo de analytics
│   │   │   ├── chatbot/           # Módulo de chatbot
│   │   │   └── user/              # Perfil de usuario
│   │   ├── (admin)/               # Grupo de rutas administrativas
│   │   │   └── users/             # Gestión de usuarios
│   │   └── api/                   # API Routes (22+ endpoints)
│   │       ├── analytics/v1/      # APIs de analytics (protegidas)
│   │       ├── chatbot/           # APIs de chatbot (protegidas)
│   │       └── auth/              # APIs de autenticación
│   ├── 📂 components/             # Componentes reutilizables
│   │   ├── auth/                  # Componentes de autenticación
│   │   ├── charts/                # Gráficos (Line, Bar, Donut, Bubble)
│   │   ├── common/                # Componentes comunes modularizados
│   │   │   ├── EditProfileModal/  # Modal de perfil (394→31 líneas)
│   │   │   ├── ChartPair/         # Componente de gráficos pareados
│   │   │   └── DeltaCard/         # Cards con deltas
│   │   └── dashboard/             # Componentes del dashboard
│   ├── 📂 features/               # Módulos de funcionalidades
│   │   ├── analytics/             # Feature de analytics
│   │   │   ├── hooks/             # Custom hooks
│   │   │   ├── sections/          # Secciones del dashboard
│   │   │   └── context/           # Context providers
│   │   ├── chatbot/               # Feature de chatbot (refactorizado)
│   │   │   ├── components/        # Componentes modularizados
│   │   │   │   ├── CategoryExpandedCard/ # (449→189 líneas)
│   │   │   │   └── TownExpandedCard/     # (447→188 líneas)
│   │   │   ├── hooks/             # Custom hooks
│   │   │   └── sections/          # Secciones
│   │   └── home/                  # Feature de home
│   ├── 📂 lib/                    # Librerías y utilidades
│   │   ├── services/              # Servicios de API
│   │   │   └── chatbot/           # Servicios de chatbot
│   │   │       ├── shared/        # Helpers compartidos (155 líneas)
│   │   │       ├── categoryTotals.ts  # (304→269 líneas)
│   │   │       ├── townTotals.ts      # (302→263 líneas)
│   │   │       └── ...            # Otros servicios optimizados
│   │   ├── utils/                 # Utilidades generales
│   │   │   ├── data/              # Procesamiento de datos
│   │   │   │   ├── timeSeries.ts      # Módulo de series temporales
│   │   │   │   ├── donutBuilder.ts    # Constructor de donuts
│   │   │   │   └── timeAxis.ts        # Generación de ejes temporales
│   │   │   ├── time/              # Utilidades de tiempo (consolidadas)
│   │   │   ├── analytics/         # Utilidades de analytics
│   │   │   │   └── donut/         # Módulos de donut refactorizados
│   │   │   ├── delta/             # Cálculos de delta (refactorizado)
│   │   │   └── string/            # Utilidades de strings
│   │   └── types/                 # Tipos TypeScript
│   ├── 📂 layout/                 # Layouts del dashboard
│   └── 📂 server/                 # Configuración del servidor
│       └── trpc/                  # tRPC procedures
├── 📂 __tests__/                  # Tests unitarios (233 tests)
├── 📂 e2e/                        # Tests End-to-End
└── 📂 prisma/                     # Schema y migraciones de BD
    ├── schema.prisma              # Schema de la base de datos
    ├── seed.ts                    # Seed data
    └── migrations/                # Migraciones
```

### **🎯 Páginas y Flujos de Trabajo**

#### **1. Página Principal (`/`)**

- **Componentes**: 8 críticos identificados
- **Flujo**: Resumen ejecutivo → KPIs → Charts comparativos
- **Análisis**: [`analysis/page-home-workflow.md`](./analysis/page-home-workflow.md)

#### **2. Analytics Dashboard (`/analytics`)**

- **Componentes**: 15 críticos identificados
- **Flujo**: Filtros temporales → Drilldown por categorías → Visualizaciones
- **Análisis**: [`analysis/page-analytics-workflow.md`](./analysis/page-analytics-workflow.md)

#### **3. Chatbot Analytics (`/chatbot`)**

- **Componentes**: 8 críticos (60% de código innecesario eliminado)
- **Flujo**: Categorías → Towns → Drilldown detallado
- **Análisis**: [`analysis/page-chatbot-workflow.md`](./analysis/page-chatbot-workflow.md)

#### **4. Administración (`/users`)**

- **Componentes**: 5 críticos identificados
- **Flujo**: Gestión de usuarios → Roles → Permisos
- **Análisis**: [`analysis/page-admin-users-workflow.md`](./analysis/page-admin-users-workflow.md)

---

## 🛠️ Stack Tecnológico

### **Frontend**

- **Framework**: Next.js 15.4.5 (App Router)
- **UI**: Tailwind CSS 4.0 + Custom Components
- **Estado**: React Query (TanStack Query) + Context API
- **Charts**: Recharts + Custom D3.js integrations
- **Autenticación**: Auth0 + Next.js Middleware

### **Backend**

- **API**: Next.js API Routes
- **Base de Datos**: PostgreSQL (Neon)
- **ORM**: Prisma 6.14.0
- **External APIs**: Google Analytics 4 API

### **Testing & Quality**

- **Tests Unitarios**: Vitest (88 tests ✅)
- **Tests E2E**: Playwright
- **Linting**: ESLint + TypeScript
- **Mocking**: MSW (Mock Service Worker)

### **DevOps & Deployment**

- **CI/CD**: GitHub Actions (pendiente)
- **Hosting**: Vercel
- **Database**: Neon PostgreSQL
- **Monitoring**: Built-in analytics

---

## ⚡ Quick Start

### **Prerequisitos**

- Node.js 18+
- npm/yarn/pnpm
- PostgreSQL (o usar Neon)

### **1. Instalación**

```bash
# Clonar el repositorio
git clone https://github.com/Thyroi/analytics-dashboard-tailadmin.git
cd analytics-dashboard-tailadmin

# Instalar dependencias
npm install

# Generar Prisma client
npx prisma generate
```

### **2. Configuración de Entorno**

Crear `.env` con las siguientes variables:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL='postgresql://user:password@host/database?sslmode=require'
DIRECT_URL='postgresql://user:password@host/database?sslmode=require'

# Auth0
AUTH0_SECRET='your-auth0-secret'
AUTH0_DOMAIN='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
APP_BASE_URL='http://localhost:3000'

# Google Analytics 4
GA_PROPERTY_ID='properties/your-property-id'
GA_PROPERTY_ID_WPIDEANTO='properties/your-secondary-property'
GA_CLIENT_EMAIL='your-service-account@project.iam.gserviceaccount.com'
GA_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----...'
```

### **3. Desarrollo**

```bash
# Ejecutar en modo desarrollo
npm run dev

# Abrir http://localhost:3000
```

### **4. Testing**

```bash
# Tests unitarios
npm run test:run        # Ejecutar una vez
npm run test           # Modo watch
npm run test:ui        # UI interactiva

# Tests E2E
npm run test:e2e       # Playwright tests
npm run test:e2e:ui    # Playwright UI

# Todo el testing
npm run test:all       # Unit + E2E
```

### **5. Build y Deploy**

```bash
# Build para producción
npm run build

# Ejecutar en producción
npm start

# Validar proyecto completo
npm run validate       # Types + Tests + Lint
```

---

## 📊 Features y Funcionalidades

### **🏠 Dashboard Principal**

- ✅ KPIs ejecutivos en tiempo real
- ✅ Gráficos comparativos (actual vs período anterior)
- ✅ Resumen por categorías y towns
- ✅ Filtros temporales avanzados (día, semana, mes, año)

### **📈 Analytics Avanzado**

- ✅ Integración completa con GA4 API
- ✅ Drilldown multi-nivel (categoría → subcategoría → detalle)
- ✅ Visualizaciones interactivas (Line, Bar, Donut charts)
- ✅ Comparaciones periodo a periodo
- ✅ Export de datos y reportes

### **🤖 Chatbot Analytics**

- ✅ Análisis de interacciones del chatbot
- ✅ Métricas por categorías de consultas
- ✅ Análisis geográfico (por municipios)
- ✅ Trending de consultas populares
- ✅ Performance y response time metrics

### **👥 Gestión de Usuarios**

- ✅ Autenticación completa con Auth0
- ✅ Sistema de roles y permisos
- ✅ Perfil de usuario personalizable
- ✅ Dashboard administrativo

### **🧪 Testing & Quality**

- ✅ **88 tests unitarios** todos pasando
- ✅ Coverage completo de componentes críticos
- ✅ Tests E2E para flujos principales
- ✅ Mocking de APIs externas
- ✅ CI/CD pipeline preparado

---

## 🧹 Optimización y Limpieza

### **Análisis Arquitectónico Completo**

Se realizó un análisis exhaustivo de toda la arquitectura:

- **📋 7 páginas analizadas** con workflows detallados
- **🔍 87 componentes evaluados** (33 críticos + 54 eliminables)
- **⚡ 60% de código innecesario eliminado** en el módulo chatbot
- **✅ 100% funcionalidad preservada**

### **Componentes Críticos Identificados**

| Módulo        | Críticos       | Eliminados | Optimización     |
| ------------- | -------------- | ---------- | ---------------- |
| **Home**      | 8 componentes  | 0          | Todos necesarios |
| **Analytics** | 15 componentes | 3          | 20% optimizado   |
| **Chatbot**   | 8 componentes  | 20+        | 60% optimizado   |
| **Admin**     | 5 componentes  | 0          | Todos necesarios |
| **Common**    | 7 componentes  | 2          | 22% optimizado   |

### **Documentación Generada**

Toda la documentación de análisis está disponible en [`/analysis/`](./analysis/):

- 📄 Workflows detallados por página
- 📄 Mapping completo de componentes
- 📄 Consolidación final con recomendaciones
- 📄 Análisis crítico de arquitectura

---

## 🔧 Scripts Disponibles

### **Desarrollo**

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm start           # Servidor de producción
```

### **Testing**

```bash
npm run test         # Tests en modo watch
npm run test:run     # Tests una sola vez
npm run test:ui      # Interface visual de tests
npm run test:coverage # Tests con coverage
npm run test:e2e     # Tests End-to-End
npm run test:all     # Todos los tests
```

### **Calidad de Código**

```bash
npm run lint         # ESLint
npm run validate     # Validación completa
npm run validate:types    # Solo TypeScript
npm run validate:tests    # Solo tests
npm run validate:lint     # Solo linting
```

### **Base de Datos**

```bash
npx prisma generate  # Generar cliente
npx prisma db push   # Actualizar esquema
npx prisma studio    # Interface visual
```

---

## 🚀 Deployment Guide

### **Vercel Deployment**

1. **Conectar repositorio**:

   ```bash
   # Push a GitHub
   git push origin main

   # Vercel detectará automáticamente el proyecto Next.js
   ```

2. **Variables de entorno**:

   - Configurar todas las variables de `.env` en Vercel Dashboard
   - Especial atención a `AUTH0_SECRET` y `GA_PRIVATE_KEY`

3. **Build settings**:

   ```bash
   # Build Command (automático)
   npm run build

   # Install Command (automático)
   npm install
   ```

### **Base de Datos**

```bash
# Ya configurado con:
# - Connection pooling habilitado
# - SSL requerido
# - Backup automático
# - High availability

# Generar Prisma client
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy

# Ver base de datos (GUI)
npx prisma studio

# Más información: docs/PRISMA-GUIDE.md
```

---

## 🤝 Contributing

### **Git Workflow**

```bash
# Feature branch
git checkout -b feature/nueva-funcionalidad

# Desarrollo
npm run dev
npm run test:watch

# Pre-commit
npm run validate

# Commit y push
git add .
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

### **Standards**

- ✅ TypeScript estricto
- ✅ ESLint + Prettier
- ✅ Tests obligatorios para nuevas features
- ✅ Documentación actualizada
- ✅ Semantic commits

---

## 📚 Documentación Adicional

### **📖 Guías Técnicas**

- **[`docs/API-ROUTES.md`](./docs/API-ROUTES.md)** - Documentación completa de APIs (22+ endpoints)
- **[`docs/PROJECT-SUMMARY.md`](./docs/PROJECT-SUMMARY.md)** - 📊 Resumen ejecutivo del proyecto (entrega final)
- **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** - 🏗️ Arquitectura completa del sistema
- **[`docs/API-ROUTES.md`](./docs/API-ROUTES.md)** - 🌐 Documentación de 22+ APIs
- **[`docs/REFACTORING-SUMMARY.md`](./docs/REFACTORING-SUMMARY.md)** - 🔄 Resumen de refactorización (6 fases)
- **[`docs/PRISMA-GUIDE.md`](./docs/PRISMA-GUIDE.md)** - 🗄️ Guía de Prisma, migraciones y troubleshooting
- **[`docs/DRILLDOWN-TOWNS-GUIDE.md`](./docs/DRILLDOWN-TOWNS-GUIDE.md)** - 🎯 Guía de drilldown
- **[`docs/HYBRID-AUTH.md`](./docs/HYBRID-AUTH.md)** - 🔐 Sistema de autenticación híbrida

### **📊 Análisis Arquitectónico (Histórico)**

- [`analysis/FINAL-COMPONENT-CONSOLIDATION.md`](./analysis/FINAL-COMPONENT-CONSOLIDATION.md) - Resumen ejecutivo
- [`analysis/page-home-workflow.md`](./analysis/page-home-workflow.md) - Dashboard principal
- [`analysis/page-analytics-workflow.md`](./analysis/page-analytics-workflow.md) - Analytics
- [`analysis/page-chatbot-workflow.md`](./analysis/page-chatbot-workflow.md) - Chatbot
- [`analysis/page-admin-users-workflow.md`](./analysis/page-admin-users-workflow.md) - Administración

### **🛠️ Configuración y Setup**

- **[`GIT_VALIDATION.md`](./GIT_VALIDATION.md)** - Pre-push validation hooks
- **[`PRISMA_SOLUTION.md`](./PRISMA_SOLUTION.md)** - Soluciones a problemas de Prisma
- **[`.env.example`](./.env.example)** - Variables de entorno requeridas

---

## 📞 Support & Contact

- **Repositorio**: [GitHub - analytics-dashboard-tailadmin](https://github.com/Thyroi/analytics-dashboard-tailadmin)
- **Issues**: Usar GitHub Issues para bugs y feature requests
- **Documentation**: Toda la documentación está en `/analysis/` y archivos `.md`

---

**⚡ Built with optimization in mind • 📊 Data-driven decisions • 🔒 Security first**
