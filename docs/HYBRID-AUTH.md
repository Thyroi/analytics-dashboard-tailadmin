# Sistema de Autenticación Híbrida

## ✅ Implementación Completada

Este proyecto ahora soporta **autenticación híbrida**: los usuarios pueden iniciar sesión con **Auth0** o con **email/contraseña local**.

## 🔐 Características

- **Auth0**: Autenticación externa (OAuth)
- **Login Local**: Email + contraseña con Argon2
- **JWT**: Tokens seguros para sesiones locales
- **Contraseña por defecto**: `condadoHuelva123` (cambiar en primer login)

## 📦 Dependencias Instaladas

```bash
npm install argon2 jose
```

## 🗄️ Migración de Base de Datos

### Cambios en el schema:

```prisma
model User {
  auth0Sub  String?  // Ahora opcional
  password  String?  // Nueva columna
  // ...resto
}
```

### Ejecutar migración:

```bash
npx prisma migrate dev --name add_password_for_hybrid_auth
npx prisma generate
```

### Asignar passwords a usuarios existentes:

```bash
npx tsx scripts/set-default-passwords.ts
```

## 🌐 Endpoints API

### Login Local

```
POST /api/auth/local/login
Body: { "email": "user@example.com", "password": "..." }
```

### Logout Local

```
POST /api/auth/local/logout
```

### Auth0 (existentes)

```
GET /api/auth/login
GET /api/auth/logout
GET /api/auth/callback
```

## 🎨 UI de Login

Página: `/login`

- Formulario de email/password
- Botón de login con Auth0
- Responsive y con dark mode

## 🔧 Configuración

Agregar en `.env`:

```env
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

## 🚀 Flujo de Autenticación

### Opción 1: Auth0

1. Usuario hace clic en "Auth0"
2. Redirige a Auth0
3. Callback → crea/actualiza usuario en DB
4. Sesión Auth0 establecida

### Opción 2: Login Local

1. Usuario ingresa email/password
2. Valida con Argon2
3. Genera JWT token
4. Cookie `local-auth-token` establecida
5. Sesión local establecida

## 📝 Estructura de Archivos

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx                    # UI de login
│   └── api/
│       └── auth/
│           └── local/
│               ├── login/route.ts      # Endpoint login
│               └── logout/route.ts     # Endpoint logout
├── lib/
│   └── jwt.ts                          # Utilidades JWT
├── server/
│   ├── auth/
│   │   └── ensureUser.ts               # Lógica híbrida
│   └── trpc/
│       ├── context.ts                  # Contexto híbrido
│       └── router.ts                   # Middleware híbrido
└── scripts/
    └── set-default-passwords.ts        # Script migración
```

## ⚠️ Seguridad

- Passwords hasheados con **Argon2** (salt rounds automático)
- JWT con expiración de 7 días
- HttpOnly cookies
- Secure en producción
- CSRF protection con SameSite

## 🔄 Próximos Pasos (Opcional)

- [ ] Implementar "Olvidé mi contraseña"
- [ ] Forzar cambio de contraseña en primer login
- [ ] Rate limiting en endpoints de login
- [ ] 2FA (Two-Factor Authentication)
- [ ] Logs de actividad de login

## 👥 Usuarios de Prueba

Todos los usuarios existentes tienen la contraseña por defecto:

```
condadoHuelva123
```

Emails en el sistema:

- programador@ideanto.com
- prueba2@hotmail.com
- thyroi0208@gmail.com
- mancomunidadcondado@gmail.com
- ideanto2.0@gmail.com
- javierbotella@ideanto.com
