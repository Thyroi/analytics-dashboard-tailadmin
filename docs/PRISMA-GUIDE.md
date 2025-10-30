# 🗄️ Prisma Guide - Analytics Dashboard

**Guía completa de Prisma ORM para el proyecto Analytics Dashboard**

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Setup Inicial](#setup-inicial)
3. [Schema de la Base de Datos](#schema-de-la-base-de-datos)
4. [Comandos Principales](#comandos-principales)
5. [Crear Migraciones](#crear-migraciones)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## 🎯 Introducción

Este proyecto usa **Prisma 6.14.0** como ORM para interactuar con PostgreSQL (Neon).

### **Características**
- ✅ Type-safe database client
- ✅ Migraciones automáticas
- ✅ Prisma Studio (GUI visual)
- ✅ Connection pooling (Neon)
- ✅ Hybrid authentication support

---

## 🚀 Setup Inicial

### **1. Instalar Prisma**

```bash
# Ya instalado en el proyecto
npm install prisma @prisma/client --save
```

### **2. Configurar Variables de Entorno**

Crear `.env` en la raíz del proyecto:

```bash
# Database URLs (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:password@host/database?sslmode=require"
```

**Notas importantes:**
- `DATABASE_URL`: Usa **pooled connection** (con `pgbouncer=true`)
- `DIRECT_URL`: Usa **direct connection** (para migraciones)
- **SSL es requerido** por Neon
- Endpoints diferentes para pooled vs direct

### **3. Generar Prisma Client**

```bash
# Generar el cliente TypeScript
npx prisma generate

# O usar el script del proyecto
npm run db:ensure
```

---

## 📊 Schema de la Base de Datos

### **Ubicación:** `prisma/schema.prisma`

### **Modelos Principales**

#### **User (Sistema de Autenticación)**

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  password      String?  // Para hybrid auth (local login)
  role          String   @default("viewer")
  emailVerified DateTime?
  image         String?
  
  // Auth0 fields
  auth0Sub      String?  @unique
  
  // Profile fields
  firstName     String?
  lastName      String?
  phone         String?
  address       String?
  city          String?
  country       String?
  postalCode    String?
  bio           String?
  
  // Social media
  facebook      String?
  twitter       String?
  instagram     String?
  linkedin      String?
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("users")
}
```

**Roles disponibles:**
- `admin`: Acceso completo, gestión de usuarios
- `editor`: Puede editar datos
- `viewer`: Solo lectura (default)

---

## 🛠️ Comandos Principales

### **Desarrollo**

```bash
# Generar Prisma Client (después de cambios en schema)
npx prisma generate

# Aplicar cambios de schema a la BD (sin crear migración)
npx prisma db push

# Ver estado de migraciones
npx prisma migrate status

# Abrir Prisma Studio (GUI visual)
npx prisma studio
```

### **Producción**

```bash
# Generar cliente
npx prisma generate

# Aplicar migraciones pendientes
npx prisma migrate deploy
```

### **Scripts del Proyecto**

```bash
# Asegurar que Prisma esté listo (limpia cache + genera)
npm run db:ensure

# Solo generar cliente
npx prisma generate
```

---

## 📝 Crear Migraciones

### **Proceso Completo**

#### **1. Modificar Schema**

Editar `prisma/schema.prisma`:

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  name  String?
  
  // ➕ NUEVO CAMPO
  avatar String?
  
  @@map("users")
}
```

#### **2. Crear Migración**

```bash
# Crear migración con nombre descriptivo
npx prisma migrate dev --name add_user_avatar

# O sin nombre (generará automáticamente)
npx prisma migrate dev
```

**¿Qué hace esto?**
- ✅ Valida el schema
- ✅ Crea archivo de migración SQL en `prisma/migrations/`
- ✅ Aplica la migración a la BD
- ✅ Regenera Prisma Client automáticamente

#### **3. Verificar Migración**

```bash
# Ver archivo SQL generado
cat prisma/migrations/YYYYMMDDHHMMSS_add_user_avatar/migration.sql

# Contenido típico:
# -- AlterTable
# ALTER TABLE "users" ADD COLUMN "avatar" TEXT;
```

#### **4. Aplicar en Producción**

```bash
# En el servidor de producción
npx prisma migrate deploy
```

---

## 🔧 Comandos Avanzados

### **Reset de Base de Datos**

```bash
# ⚠️ CUIDADO: Elimina TODOS los datos
npx prisma migrate reset

# Esto hace:
# 1. Drop de la base de datos
# 2. Crea nueva base de datos
# 3. Aplica todas las migraciones
# 4. Ejecuta seed (si existe)
```

### **Seed de Datos**

```bash
# Ejecutar seed manualmente
npx prisma db seed

# Archivo de seed: prisma/seed.ts
```

### **Introspección**

```bash
# Generar schema desde base de datos existente
npx prisma db pull

# Útil si haces cambios directos en la BD
```

### **Formato de Schema**

```bash
# Formatear schema.prisma
npx prisma format
```

---

## 🐛 Troubleshooting

### **Error: "Can't reach database server"**

**Problema:** No se puede conectar a la BD.

**Soluciones:**
1. Verificar que `DATABASE_URL` esté correcto en `.env`
2. Verificar que SSL esté habilitado: `?sslmode=require`
3. Verificar que Neon database esté activo
4. Probar conexión: `npx prisma db push`

```bash
# Test de conexión
npx prisma db push --skip-generate
```

### **Error: "Migration failed"**

**Problema:** Una migración no se puede aplicar.

**Soluciones:**

```bash
# Ver estado de migraciones
npx prisma migrate status

# Marcar migración como aplicada (si ya lo está manualmente)
npx prisma migrate resolve --applied "YYYYMMDD_migration_name"

# Marcar como rolled back
npx prisma migrate resolve --rolled-back "YYYYMMDD_migration_name"
```

### **Error: "Prisma Client not generated"**

**Problema:** El cliente no se generó correctamente.

**Soluciones:**

```bash
# Limpiar y regenerar
npm run db:ensure

# O manual:
rm -rf node_modules/.prisma
npx prisma generate
```

### **Error: "Connection pool timeout"**

**Problema:** Demasiadas conexiones abiertas (común en desarrollo).

**Soluciones:**

```bash
# 1. Usar DIRECT_URL para comandos de Prisma
export DATABASE_URL=$DIRECT_URL
npx prisma migrate dev

# 2. O configurar en schema.prisma:
# datasource db {
#   provider  = "postgresql"
#   url       = env("DATABASE_URL")
#   directUrl = env("DIRECT_URL")
# }
```

### **Error: "Schema drift detected"**

**Problema:** Schema local difiere de la BD.

**Soluciones:**

```bash
# Ver diferencias
npx prisma migrate status

# Opción 1: Crear migración para las diferencias
npx prisma migrate dev --name fix_schema_drift

# Opción 2: Resetear BD (⚠️ elimina datos)
npx prisma migrate reset
```

---

## ✨ Best Practices

### **1. Migraciones**

✅ **DO:**
- Crear una migración por cada cambio lógico
- Usar nombres descriptivos: `add_user_avatar`, `create_posts_table`
- Commitear migraciones al repositorio
- Probar migraciones en desarrollo antes de aplicar en producción
- Usar `migrate deploy` en producción (nunca `migrate dev`)

❌ **DON'T:**
- No editar migraciones ya aplicadas
- No usar `db push` en producción
- No hacer cambios manuales en la BD sin crear migración

### **2. Schema Design**

```prisma
// ✅ Buenas prácticas

model User {
  // IDs
  id String @id @default(cuid())  // ✅ CUID es más seguro que auto-increment
  
  // Unique constraints
  email String @unique             // ✅ Siempre unique para emails
  
  // Required vs Optional
  name  String?                    // ✅ ? para campos opcionales
  email String                     // ✅ Sin ? para requeridos
  
  // Timestamps
  createdAt DateTime @default(now())  // ✅ Siempre incluir timestamps
  updatedAt DateTime @updatedAt       // ✅ Auto-actualizado
  
  // Table naming
  @@map("users")                  // ✅ Lowercase plural para tablas
}
```

### **3. Client Usage**

```typescript
// ✅ Singleton pattern para Prisma Client
// src/server/db.ts

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### **4. Queries Optimizadas**

```typescript
// ✅ Usar select para campos específicos
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    name: true,
    // Solo traer lo necesario
  },
});

// ✅ Usar include para relaciones
const userWithPosts = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    posts: true,
  },
});

// ✅ Transacciones para operaciones múltiples
await prisma.$transaction([
  prisma.user.update({ ... }),
  prisma.post.create({ ... }),
]);
```

### **5. Error Handling**

```typescript
import { Prisma } from '@prisma/client';

try {
  const user = await prisma.user.create({ ... });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint violation
    if (error.code === 'P2002') {
      throw new Error('Email already exists');
    }
  }
  throw error;
}
```

---

## 📚 Recursos Adicionales

### **Documentación Oficial**
- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

### **Neon Specifics**
- [Neon + Prisma Guide](https://neon.tech/docs/guides/prisma)
- [Connection Pooling](https://neon.tech/docs/connect/connection-pooling)

### **En Este Proyecto**
- Schema: `prisma/schema.prisma`
- Migraciones: `prisma/migrations/`
- Seed: `prisma/seed.ts`
- Cliente: `src/server/db.ts`

---

## 🔄 Workflow de Desarrollo

### **Caso 1: Agregar Nueva Tabla**

```bash
# 1. Editar schema.prisma
# 2. Crear migración
npx prisma migrate dev --name create_posts_table

# 3. Verificar en Studio
npx prisma studio

# 4. Usar en código
import { prisma } from '@/server/db';
const posts = await prisma.post.findMany();
```

### **Caso 2: Modificar Tabla Existente**

```bash
# 1. Editar schema.prisma
# 2. Crear migración
npx prisma migrate dev --name add_user_role_field

# 3. El cliente se regenera automáticamente
# 4. Usar nueva field en código
```

### **Caso 3: Deploy a Producción**

```bash
# En servidor de producción:
# 1. Pull código con nuevas migraciones
git pull origin main

# 2. Instalar dependencias
npm install

# 3. Aplicar migraciones
npx prisma migrate deploy

# 4. Generar cliente
npx prisma generate

# 5. Rebuild aplicación
npm run build
```

---

## ⚡ Quick Reference

### **Comandos Más Usados**

```bash
# Desarrollo
npx prisma studio              # Abrir GUI
npx prisma generate            # Regenerar cliente
npx prisma migrate dev         # Crear y aplicar migración
npx prisma db push             # Push sin migración (prototipado)

# Producción
npx prisma migrate deploy      # Aplicar migraciones
npx prisma generate            # Generar cliente

# Troubleshooting
npx prisma migrate status      # Ver estado
npx prisma migrate reset       # Reset completo (⚠️)
npx prisma format              # Formatear schema
```

### **Códigos de Error Comunes**

| Código | Significado | Solución |
|--------|-------------|----------|
| `P2002` | Unique constraint violation | Email/campo ya existe |
| `P2025` | Record not found | Verificar ID |
| `P1001` | Can't reach database | Verificar conexión |
| `P3006` | Migration failed | Ver logs, resolver manualmente |

---

**✨ Happy coding with Prisma!**
