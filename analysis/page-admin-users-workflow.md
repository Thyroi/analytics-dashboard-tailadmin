# 👥 PÁGINA ADMIN/USERS - WORKFLOW ANALYSIS

## 📋 Información General

- **Ruta**: `/users` (app/(admin)/users/page.tsx)
- **Propósito**: Administración de usuarios del sistema con roles y permisos
- **Layout**: Utiliza layout de admin con sidebar y header

## 🔄 Flujo de Negocio

### 1. **Verificación de Permisos**

- Verifica si el usuario tiene permisos ADMIN
- Si no tiene permisos, muestra mensaje de error
- Usa type guard para verificar errores TRPC

### 2. **Carga de Datos**

- `trpc.admin.listUsers.useQuery()` - Lista de usuarios
- `trpc.admin.listRoles.useQuery()` - Lista de roles disponibles
- Carga condicional de roles solo si tiene permisos

### 3. **Funcionalidades Principales**

#### A. **Visualización de Usuarios**

- Grid/tabla con información completa de usuarios
- Columnas: Usuario (avatar+nombre+email), Rol, Fecha creación
- Búsqueda/filtrado por nombre, email, rol

#### B. **Gestión de Roles**

- Dropdown para cambiar rol de usuario
- Actualización en tiempo real via `setUserRole.mutate()`
- Invalidación automática de cache

#### C. **Acciones de Usuario**

- Botón "Edit" (placeholder con alert)
- Botón "Delete" con confirmación
- Actualización automática de lista tras cambios

## 🎯 Flujo de Usuario

1. Usuario admin accede a `/users`
2. Ve tabla con todos los usuarios del sistema
3. Puede buscar/filtrar usuarios específicos
4. Puede cambiar roles usando dropdown
5. Puede eliminar usuarios con confirmación
6. Cambios se reflejan inmediatamente

## 🔗 Dependencias Directas

- `DataTable` - Componente principal de tabla
- `trpc` - Cliente para API calls
- Mutaciones: `setUserRole`, `deleteUser`
- Queries: `listUsers`, `listRoles`

## 📊 Tipo de Datos

- Información de usuario: nombre, email, avatar, fecha
- Roles y permisos del sistema
- Estado de carga y errores
- Filtros de búsqueda
