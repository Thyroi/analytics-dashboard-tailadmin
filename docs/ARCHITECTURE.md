# 🏗️ Arquitectura del Sistema - Analytics Dashboard

> **Documentación Técnica de Arquitectura**
> Analytics Dashboard para análisis de datos turísticos de Huelva
> Última actualización: Octubre 30, 2025

---

## 📑 Tabla de Contenidos

1. [Visión General](#-visión-general)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Arquitectura de Aplicación](#-arquitectura-de-aplicación)
4. [Patrones de Diseño](#-patrones-de-diseño)
5. [Flujo de Datos](#-flujo-de-datos)
6. [Módulos Principales](#-módulos-principales)
7. [APIs y Endpoints](#-apis-y-endpoints)
8. [Base de Datos](#-base-de-datos)
9. [Autenticación y Autorización](#-autenticación-y-autorización)
10. [Testing](#-testing)
11. [Performance y Optimización](#-performance-y-optimización)
12. [Decisiones Arquitectónicas](#-decisiones-arquitectónicas)

---

## 🎯 Visión General

### **Propósito del Sistema**

Dashboard de analytics para análisis avanzado de datos turísticos de Huelva, integrando:

- **Google Analytics 4** (datos de tráfico web)
- **Base de datos propia** (usuarios, roles, taxonomías)
- **Chatbot Analytics** (análisis de categorías y pueblos)
- **Gestión de usuarios** (administración con roles)

### **Características Principales**

- 📊 **Analytics Multidimensional**: Análisis por pueblos, categorías, subcategorías
- 🤖 **Chatbot Analytics**: Dashboard específico para análisis del chatbot
- 🗺️ **Drilldown Geográfico**: Navegación jerárquica (país → región → ciudad)
- 👥 **Gestión de Usuarios**: Sistema completo con roles y permisos
- 📈 **Visualizaciones Avanzadas**: Charts, mapas, donuts, KPIs con tendencias
- 🔐 **Autenticación Híbrida**: Auth0 + credenciales locales

---

## 🛠️ Stack Tecnológico

### **Frontend**

| Tecnología         | Versión | Propósito                                |
| ------------------ | ------- | ---------------------------------------- |
| **Next.js**        | 15.4.5  | Framework React con App Router, SSR, RSC |
| **React**          | 19.0    | Librería UI con Server Components        |
| **TypeScript**     | 5.9.2   | Tipado estático y seguridad de tipos     |
| **Tailwind CSS**   | 4.0     | Utility-first CSS framework              |
| **Recharts**       | 2.x     | Librería de gráficos declarativa         |
| **TanStack Query** | 5.x     | Gestión de estado del servidor           |
| **Lucide React**   | Latest  | Iconografía moderna                      |

### **Backend**

| Tecnología             | Versión | Propósito                         |
| ---------------------- | ------- | --------------------------------- |
| **Next.js API Routes** | 15.4.5  | Backend API con edge runtime      |
| **tRPC**               | Latest  | Type-safe APIs sin código         |
| **Prisma**             | 6.14.0  | ORM con migraciones y type-safety |
| **PostgreSQL**         | Latest  | Base de datos relacional (Neon)   |
| **Auth0**              | Latest  | Autenticación OAuth2/OIDC         |
| **Jose**               | Latest  | JWT para auth local               |

### **Testing & Quality**

| Tecnología     | Versión | Propósito                  |
| -------------- | ------- | -------------------------- |
| **Vitest**     | 3.2.4   | Unit & Integration testing |
| **Playwright** | Latest  | E2E testing                |
| **ESLint**     | Latest  | Linting y code quality     |
| **TypeScript** | 5.9.2   | Type checking en CI/CD     |

### **Infraestructura**

| Servicio      | Provider           | Propósito             |
| ------------- | ------------------ | --------------------- |
| **Hosting**   | Vercel             | Deployment y hosting  |
| **Database**  | Neon               | PostgreSQL serverless |
| **Analytics** | Google Analytics 4 | Datos de tráfico      |
| **Auth**      | Auth0              | Autenticación externa |
| **Git**       | GitHub             | Control de versiones  |

---

## 🏛️ Arquitectura de Aplicación

### **Modelo Arquitectónico: Feature-Sliced Design + Module Federation**

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js App Router (React Server Components)        │   │
│  │  - Page Routes                                        │   │
│  │  - Layouts                                            │   │
│  │  - Server Actions                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       FEATURE MODULES                        │
│  ┌─────────────┐  ┌──────────┐  ┌─────────────────────┐    │
│  │  Analytics  │  │ Chatbot  │  │  Admin (Users)      │    │
│  │             │  │          │  │                     │    │
│  │ • Sections  │  │ • Hooks  │  │ • User Management   │    │
│  │ • Hooks     │  │ • Comps  │  │ • Role Management   │    │
│  │ • Context   │  │ • Utils  │  │ • DataTable         │    │
│  └─────────────┘  └──────────┘  └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SHARED COMPONENTS                         │
│  ┌────────┐  ┌────────┐  ┌─────────┐  ┌────────────────┐   │
│  │ Charts │  │ Common │  │Dashboard│  │  Skeletons     │   │
│  │        │  │        │  │         │  │                │   │
│  │• Line  │  │• Header│  │• KPIs   │  │• KPIList       │   │
│  │• Donut │  │• Delta │  │• Donut  │  │• ChartPair     │   │
│  │• Bar   │  │• Table │  │• Demo   │  │• CityList      │   │
│  └────────┘  └────────┘  └─────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC                          │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │   Services     │  │   Utilities    │  │   Types      │  │
│  │                │  │                │  │              │  │
│  │ • Analytics    │  │ • Formatters   │  │ • Models     │  │
│  │ • Chatbot      │  │ • Aggregators  │  │ • Schemas    │  │
│  │ • Drilldown    │  │ • Filters      │  │ • DTOs       │  │
│  │ • Taxonomy     │  │ • Delta Calc   │  │              │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        API LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  REST APIs   │  │    tRPC      │  │  Middleware     │   │
│  │              │  │              │  │                 │   │
│  │ • Analytics  │  │ • Type-safe  │  │ • Auth Check    │   │
│  │ • Chatbot    │  │ • Procedures │  │ • CORS          │   │
│  │ • Auth       │  │ • Routers    │  │ • Rate Limit    │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │     Prisma ORM   │              │   GA4 Client     │     │
│  │                  │              │                  │     │
│  │ • Type-safe DB   │              │ • Analytics API  │     │
│  │ • Migrations     │              │ • Data Reports   │     │
│  │ • Relationships  │              │ • Dimensions     │     │
│  └────────┬─────────┘              └────────┬─────────┘     │
│           │                                 │               │
│  ┌────────▼─────────┐              ┌───────▼──────────┐    │
│  │   PostgreSQL     │              │  Google GA4      │    │
│  │   (Neon)         │              │  Property        │    │
│  └──────────────────┘              └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### **Principios Arquitectónicos**

1. **Separation of Concerns**: Cada módulo tiene responsabilidades bien definidas
2. **Feature-First Organization**: Código organizado por funcionalidades, no por tipo técnico
3. **Dependency Inversion**: Los módulos dependen de abstracciones, no de implementaciones
4. **Single Responsibility**: Cada componente/servicio tiene una única razón de cambio
5. **DRY (Don't Repeat Yourself)**: 35+ módulos compartidos para evitar duplicación

---

## 🎨 Patrones de Diseño

### **1. Server Components + Client Components (React 19)**

```tsx
// Server Component (default en App Router)
// - Acceso directo a DB/APIs
// - SEO optimizado
// - Zero bundle JavaScript
export default async function AnalyticsPage() {
  const data = await fetchAnalytics(); // Server-side
  return <AnalyticsClient data={data} />;
}

// Client Component
// - Interactividad
// - Event handlers
// - Estado local
("use client");
export function AnalyticsClient({ data }: Props) {
  const [filter, setFilter] = useState<Filter>();
  return <InteractiveChart data={data} />;
}
```

### **2. Custom Hooks Pattern**

```tsx
// Custom hook para lógica reutilizable
export function useCategoriesTotals(params: QueryParams) {
  return useQuery({
    queryKey: ["categorias-totals", params],
    queryFn: () => fetchCategoriesTotals(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Uso en componentes
function CategoryDashboard() {
  const { data, isLoading } = useCategoriesTotals({ date, granularity });
  if (isLoading) return <Skeleton />;
  return <CategoryView data={data} />;
}
```

### **3. Compound Components Pattern**

```tsx
// Componente compuesto con subcomponentes
<DataTable>
  <DataTable.Header>
    <DataTable.Column sortable />
  </DataTable.Header>
  <DataTable.Body>
    <DataTable.Row />
  </DataTable.Body>
  <DataTable.Pagination />
</DataTable>
```

### **4. Provider Pattern (Context API)**

```tsx
// Provider para estado compartido
export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Consumer hook
export function useSidebar() {
  return useContext(SidebarContext);
}
```

### **5. Factory Pattern (Services)**

```tsx
// Factory para crear servicios
export const AnalyticsServiceFactory = {
  createCategoryService: () => new CategoryAnalyticsService(),
  createTownService: () => new TownAnalyticsService(),
  createDrilldownService: () => new DrilldownService(),
};
```

### **6. Repository Pattern (Data Access)**

```tsx
// Repository para abstracción de datos
export class UserRepository {
  async findAll(filters?: Filters) {
    return prisma.user.findMany({ where: filters });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserDTO) {
    return prisma.user.create({ data });
  }
}
```

---

## 🔄 Flujo de Datos

### **Arquitectura de Data Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                          USER                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                    [UI Event]
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   REACT COMPONENT                            │
│  • State Management (useState/useReducer)                    │
│  • Event Handlers                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                  [API Call via Hook]
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  TANSTACK QUERY                              │
│  • Caching                                                   │
│  • Deduplication                                             │
│  • Background Refetch                                        │
│  • Optimistic Updates                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                [HTTP Request]
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE                                │
│  • Authentication Check                                      │
│  • CORS Handling                                             │
│  • Rate Limiting                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                  [Authorized]
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
┌──────────────────┐          ┌──────────────────┐
│   API ROUTE      │          │   tRPC Router    │
│  /api/analytics  │          │  Type-safe API   │
└────────┬─────────┘          └────────┬─────────┘
         │                              │
         │                              │
         ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                            │
│  • Business Logic                                            │
│  • Data Transformation                                       │
│  • Aggregations                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
┌──────────────────┐          ┌──────────────────┐
│   Prisma Client  │          │   GA4 Client     │
│   (PostgreSQL)   │          │   (Analytics)    │
└────────┬─────────┘          └────────┬─────────┘
         │                              │
         ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│   PostgreSQL     │          │   Google GA4     │
│   Database       │          │   Property       │
└──────────────────┘          └──────────────────┘
```

### **Ejemplo de Flujo Completo: Carga de Analytics**

1. **Usuario navega a `/analytics`**
2. **Server Component** renderiza layout inicial (SSR)
3. **Client Component** monta y ejecuta `useKPIs()` hook
4. **TanStack Query** verifica cache → si hay datos frescos, los retorna
5. Si no hay cache: **fetch** → `/api/analytics/v1/header/kpis`
6. **Middleware** verifica token de sesión
7. **API Route** llama a `AnalyticsService.getKPIs()`
8. **Service** ejecuta consulta a **GA4 API**
9. **Data** se transforma y formatea
10. **Response** se cachea en TanStack Query
11. **Component** se re-renderiza con datos
12. **Skeleton** → **Chart con datos**

---

## 📦 Módulos Principales

### **1. Analytics Module (`src/features/analytics/`)**

**Responsabilidad**: Dashboard principal de analytics con GA4

**Estructura**:

```
analytics/
├── sections/               # Secciones del dashboard
│   ├── KPIHeader/         # KPIs principales
│   ├── ComparativeTopPages/ # Comparativa de páginas
│   └── components/         # Sub-componentes
├── hooks/                  # Custom hooks
│   ├── useKPIs.ts
│   ├── useCategoriesTotals.ts
│   └── useDrilldownDetails.ts
├── context/                # Context providers
└── skeletons/              # Loading states
```

**Funcionalidades**:

- KPIs principales (users, sessions, pageviews, bounce rate)
- Gráficos de series temporales
- Drilldown multi-nivel (pueblo → categoría → subcategoría)
- Análisis demográfico (países, regiones, ciudades)
- Dispositivos y sistemas operativos
- Top páginas con comparativas

### **2. Chatbot Module (`src/features/chatbot/`)**

**Responsabilidad**: Analytics específico del chatbot

**Estructura**:

```
chatbot/
├── components/
│   ├── CategoryExpandedCard/ # Card expandible categorías
│   ├── TownExpandedCard/     # Card expandible pueblos
│   └── shared/               # Componentes compartidos
├── hooks/
│   ├── useCategoryTotals.ts
│   └── useTownTotals.ts
└── sections/
    └── ChatbotDashboard/
```

**Funcionalidades**:

- Totales por categoría con sinónimos
- Totales por pueblo
- Breakdown de subcategorías
- Comparativas temporales (current vs previous)
- Audit de tags

### **3. Admin Module (`src/app/(admin)/users/`)**

**Responsabilidad**: Gestión de usuarios y roles

**Estructura**:

```
users/
├── page.tsx                # Página principal
├── components/
│   ├── UserTable/          # Tabla de usuarios
│   ├── UserDialog/         # Modal crear/editar
│   └── RolesBadge/         # Badge de roles
└── actions/
    └── userActions.ts      # Server actions
```

**Funcionalidades**:

- CRUD completo de usuarios
- Gestión de roles (Admin, Editor, Viewer)
- Autenticación híbrida (Auth0 + local)
- Búsqueda y filtrado
- Paginación server-side

### **4. Home Module (`src/features/home/`)**

**Responsabilidad**: Dashboard principal (landing)

**Estructura**:

```
home/
├── sectors/
│   ├── SectorCard/
│   └── SectorExpandedCard/
├── hooks/
│   └── useResumenTown.ts
└── sections/
```

**Funcionalidades**:

- Resumen por sectores (Pueblos, Categorías)
- Gráficos de línea con tendencias
- Cards expandibles con drill-down
- Selección de granularidad temporal

---

## 🌐 APIs y Endpoints

### **Documentación Completa**: [`docs/API-ROUTES.md`](./API-ROUTES.md)

### **Estructura de APIs**

#### **1. Analytics APIs** (`/api/analytics/v1/`)

| Endpoint                           | Método | Descripción                 | Protegido |
| ---------------------------------- | ------ | --------------------------- | --------- |
| `/header/kpis`                     | GET    | KPIs principales            | ✅        |
| `/header/countries`                | GET    | Datos demográficos por país | ✅        |
| `/header/gender`                   | GET    | Distribución por género     | ✅        |
| `/header/devices/os`               | GET    | Sistemas operativos         | ✅        |
| `/dimensions/pueblos/totales`      | GET    | Totales por pueblo          | ✅        |
| `/dimensions/categorias/totales`   | GET    | Totales por categoría       | ✅        |
| `/dimensions/pueblos/details/[id]` | GET    | Detalles de pueblo          | ✅        |
| `/drilldown/url`                   | GET    | Drilldown de URL específica | ✅        |
| `/top-pages-table`                 | GET    | Tabla de top páginas        | ✅        |

#### **2. Chatbot APIs** (`/api/chatbot/`)

| Endpoint          | Método | Descripción                | Protegido |
| ----------------- | ------ | -------------------------- | --------- |
| `/top-categories` | GET    | Top categorías del chatbot | ✅        |
| `/audit/tags`     | GET    | Audit de tags              | ✅        |

#### **3. Auth APIs** (`/api/auth/`)

| Endpoint        | Método | Descripción            | Protegido |
| --------------- | ------ | ---------------------- | --------- |
| `/local/login`  | POST   | Login con credenciales | ❌        |
| `/local/logout` | POST   | Logout local           | ❌        |
| `/callback`     | GET    | Auth0 callback         | ❌        |

#### **4. tRPC APIs** (`/api/trpc/`)

Type-safe APIs con inferencia automática de tipos:

```typescript
// Router definition
export const appRouter = router({
  user: userRouter,
  analytics: analyticsRouter,
});

// Client usage (fully typed)
const users = await trpc.user.list.query();
```

### **Seguridad de APIs**

Todas las APIs de analytics y chatbot están protegidas por middleware:

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger rutas de API
  if (
    pathname.startsWith("/api/analytics") ||
    pathname.startsWith("/api/chatbot") ||
    pathname.startsWith("/api/trpc")
  ) {
    return checkAuthentication(request);
  }
}
```

---

## 💾 Base de Datos

### **Modelo de Datos (Prisma Schema)**

```prisma
// Usuario del sistema
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?   // Opcional para Auth0 users
  auth0Id       String?   @unique
  roles         Role[]
  profile       Profile?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// Perfil extendido
model Profile {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  bio           String?
  phone         String?
  avatar        String?
  company       String?
  address       String?
  city          String?
  country       String?
  postalCode    String?
}

// Roles del sistema
model Role {
  id            String    @id @default(cuid())
  name          String    @unique
  description   String?
  users         User[]
  createdAt     DateTime  @default(now())
}
```

### **Migrations**

**Guía completa**: [`docs/PRISMA-GUIDE.md`](./PRISMA-GUIDE.md)

```bash
# Crear migración
npm run db:migrate:dev

# Aplicar migraciones en producción
npm run db:migrate:deploy

# Reset base de datos (desarrollo)
npm run db:reset

# Prisma Studio (explorador visual)
npm run db:studio
```

### **Queries Comunes**

```typescript
// Obtener usuarios con roles
const users = await prisma.user.findMany({
  include: {
    roles: true,
    profile: true,
  },
});

// Crear usuario con perfil
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
    roles: {
      connect: [{ name: "Viewer" }],
    },
    profile: {
      create: {
        bio: "Analytics enthusiast",
      },
    },
  },
});
```

---

## 🔐 Autenticación y Autorización

### **Sistema de Autenticación Híbrido**

```
┌─────────────────────────────────────────────────────┐
│              AUTHENTICATION FLOW                     │
└─────────────────────────────────────────────────────┘

        ┌──────────┐
        │  Client  │
        └────┬─────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌────────┐      ┌─────────┐
│ Auth0  │      │  Local  │
│ Login  │      │  Login  │
└───┬────┘      └────┬────┘
    │                │
    │  [JWT Token]   │
    │                │
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │   Middleware   │
    │  Verification  │
    └────────┬───────┘
             │
      [Authenticated]
             │
             ▼
    ┌────────────────┐
    │  Protected     │
    │  Resources     │
    └────────────────┘
```

### **Auth0 Configuration**

```typescript
// src/lib/auth0.ts
export const auth0Config = {
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  audience: process.env.AUTH0_AUDIENCE,
  scope: "openid profile email",
};
```

### **Local Authentication**

```typescript
// src/lib/jwt.ts
export async function signToken(payload: TokenPayload) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(secret);
}
```

### **Sistema de Roles**

```typescript
enum Role {
  ADMIN = "Admin", // Acceso total
  EDITOR = "Editor", // Crear/editar contenido
  VIEWER = "Viewer", // Solo lectura
}

// Verificación de permisos
function hasPermission(user: User, action: Action) {
  return user.roles.some((role) => permissions[role].includes(action));
}
```

---

## 🧪 Testing

### **Estrategia de Testing**

```
┌─────────────────────────────────────────────────────┐
│              TESTING PYRAMID                         │
└─────────────────────────────────────────────────────┘

                  ┌─────┐
                  │ E2E │  ← Playwright (2 tests)
                  └─────┘
                ┌─────────┐
                │Integration│ ← Vitest (50 tests)
                └───────────┘
            ┌───────────────────┐
            │   Unit Tests      │ ← Vitest (183 tests)
            └───────────────────┘
```

### **Configuración Vitest**

```typescript
// vitest.config.mjs
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["__tests__/setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
```

### **Ejemplos de Tests**

**Unit Test**:

```typescript
describe("formatNumber", () => {
  it("should format numbers with K suffix", () => {
    expect(formatNumber(1500)).toBe("1.5K");
  });

  it("should format numbers with M suffix", () => {
    expect(formatNumber(1500000)).toBe("1.5M");
  });
});
```

**Integration Test**:

```typescript
describe("CategoryTotals API", () => {
  it("should return category totals", async () => {
    const response = await fetch("/api/chatbot/top-categories", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("categories");
  });
});
```

**E2E Test (Playwright)**:

```typescript
test("should navigate dashboard and view analytics", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Analytics");
  await expect(page).toHaveURL("/analytics");
  await expect(page.locator("h1")).toContainText("Analytics Dashboard");
});
```

### **Coverage Goals**

- **Unit Tests**: >80% coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Happy paths principales

**Current Status**: 234/234 tests passing (100%)

---

## ⚡ Performance y Optimización

### **Estrategias de Optimización**

#### **1. Server Components (Next.js 15)**

```tsx
// ✅ Server Component - Zero JS bundle
export default async function AnalyticsPage() {
  const data = await getServerData();
  return <StaticContent data={data} />;
}

// ❌ Evitar: Todo como Client Component
("use client");
export default function Page() {
  const [data, setData] = useState();
  useEffect(() => {
    fetchData();
  }, []);
  return <Content data={data} />;
}
```

#### **2. Data Caching (TanStack Query)**

```typescript
// Cache con staleTime y refetch automático
const { data } = useQuery({
  queryKey: ["analytics", params],
  queryFn: fetchAnalytics,
  staleTime: 5 * 60 * 1000, // 5 minutos
  refetchOnWindowFocus: false, // No refetch al focus
  refetchOnMount: false, // No refetch al mount
});
```

#### **3. Code Splitting**

```typescript
// Dynamic imports para reducir bundle inicial
const ChartModal = dynamic(() => import("./ChartModal"), {
  loading: () => <Skeleton />,
  ssr: false, // No SSR para modals
});
```

#### **4. Image Optimization**

```tsx
import Image from "next/image";

<Image
  src="/escudos_pueblos/huelva.png"
  alt="Huelva"
  width={40}
  height={40}
  loading="lazy"
  quality={85}
/>;
```

#### **5. API Response Optimization**

```typescript
// Paginación server-side
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = 20;

  const data = await prisma.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });

  return Response.json(data);
}
```

### **Métricas de Performance**

**Core Web Vitals Goals**:

- **LCP (Largest Contentful Paint)**: <2.5s
- **FID (First Input Delay)**: <100ms
- **CLS (Cumulative Layout Shift)**: <0.1

**Bundle Size**:

- First Load JS: ~99.7 kB (shared)
- Page-specific: ~9-33 kB
- Total Initial Load: <140 kB

---

## 🎯 Decisiones Arquitectónicas

### **ADR (Architecture Decision Records)**

#### **ADR-001: Adopción de Next.js 15 con App Router**

**Contexto**: Necesidad de SSR, SEO, y performance optimizada

**Decisión**: Usar Next.js 15 con App Router y React Server Components

**Consecuencias**:

- ✅ Mejor SEO y performance inicial
- ✅ Menor bundle JavaScript
- ✅ Server-side data fetching nativo
- ⚠️ Curva de aprendizaje para RSC
- ⚠️ Splitting entre Server/Client Components

#### **ADR-002: Autenticación Híbrida (Auth0 + Local)**

**Contexto**: Necesidad de OAuth para usuarios externos y credenciales para admin internos

**Decisión**: Implementar sistema híbrido con Auth0 y JWT local

**Consecuencias**:

- ✅ Flexibilidad para diferentes tipos de usuarios
- ✅ OAuth2 para seguridad externa
- ✅ Control total sobre usuarios locales
- ⚠️ Complejidad adicional en middleware
- ⚠️ Dos flujos de autenticación a mantener

#### **ADR-003: Prisma como ORM**

**Contexto**: Necesidad de type-safety y migraciones controladas

**Decisión**: Usar Prisma ORM con PostgreSQL

**Consecuencias**:

- ✅ Type-safety completo
- ✅ Migraciones versionadas
- ✅ Prisma Studio para debugging
- ✅ Excelente DX (Developer Experience)
- ⚠️ Vendor lock-in moderado

#### **ADR-004: Feature-Sliced Architecture**

**Contexto**: Código creciente sin estructura clara, duplicación

**Decisión**: Reorganizar en módulos por features con shared modules

**Consecuencias**:

- ✅ Código modular y mantenible
- ✅ Reducción de 95% de duplicación
- ✅ Fácil localización de código
- ✅ Testing más simple
- ⚠️ Refactoring masivo inicial

#### **ADR-005: TanStack Query para Server State**

**Contexto**: Necesidad de caching, refetch automático, loading states

**Decisión**: Usar TanStack Query (React Query) como estado del servidor

**Consecuencias**:

- ✅ Caching automático
- ✅ Deduplicación de requests
- ✅ Background refetch
- ✅ Optimistic updates
- ⚠️ Complejidad adicional vs fetch directo

#### **ADR-006: Monorepo con Workspaces (Descartado)**

**Contexto**: Evaluación de estructura monorepo vs single repo

**Decisión**: Mantener single repo con organización interna fuerte

**Consecuencias**:

- ✅ Setup más simple
- ✅ Deployments más fáciles
- ✅ Menos overhead de tooling
- ⚠️ Crecimiento futuro puede requerir refactor

---

## 📚 Referencias y Recursos

### **Documentación del Proyecto**

- [README.md](../README.md) - Documentación principal
- [REFACTORING-SUMMARY.md](./REFACTORING-SUMMARY.md) - Historial de refactorización
- [API-ROUTES.md](./API-ROUTES.md) - Documentación de APIs
- [PRISMA-GUIDE.md](./PRISMA-GUIDE.md) - Guía de base de datos
- [DRILLDOWN-TOWNS-GUIDE.md](./DRILLDOWN-TOWNS-GUIDE.md) - Guía de drilldown

### **Guías de Análisis**

- [page-home-workflow.md](../analysis/page-home-workflow.md)
- [page-analytics-workflow.md](../analysis/page-analytics-workflow.md)
- [page-chatbot-workflow.md](../analysis/page-chatbot-workflow.md)
- [FINAL-COMPONENT-CONSOLIDATION.md](../analysis/FINAL-COMPONENT-CONSOLIDATION.md)

### **Tecnologías Externas**

- [Next.js Documentation](https://nextjs.org/docs)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)

---

## 🔄 Changelog

### **Octubre 30, 2025** - v2.0 (Major Refactor)

- ✅ Refactorización completa de arquitectura
- ✅ 6,500+ líneas eliminadas/modularizadas
- ✅ 35+ módulos compartidos creados
- ✅ Feature-sliced architecture implementada
- ✅ 95% reducción en código duplicado
- ✅ Tests: 234/234 passing (100%)

### **Septiembre 2025** - v1.5

- ✅ Implementación de Chatbot Analytics
- ✅ Sistema de roles completo
- ✅ Drilldown multi-nivel

### **Agosto 2025** - v1.0

- ✅ Dashboard inicial
- ✅ Integración con GA4
- ✅ Autenticación Auth0

---

**Documento actualizado**: Octubre 30, 2025
**Versión**: 2.0
**Mantenedor**: Ideanto
