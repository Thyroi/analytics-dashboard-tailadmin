# Cambios realizados el 2026-02-03

## 1) Modales agregados
- Crear usuario: modal nuevo en Components/dashboard/Modal. Permite capturar nombre, apellido, email, rol y contraseña con confirmación.
- Editar rol: modal existente ajustado para editar rol desde la tabla de usuarios.
- Eliminar usuario: modal de confirmación antes de borrar.
- Cambiar contraseña: modal nuevo en Components/dashboard/Modal con contraseña actual + nueva + confirmación.

## 2) Lógica de login y sesión
- Se mantiene login local y Auth0.
- Para Auth0: ya NO se auto‑crean usuarios al iniciar sesión. Si el usuario no existe en base de datos, la app lo considera no registrado.
- Para login local: se valida usuario y contraseña con hash Argon2.
- Logout: se ajustó para usar Auth0 logout v2 y redirección a /login con URL absoluta (evita la pantalla de confirmación).

## 3) Privacidad del contenido del dashboard
- El contenido del dashboard queda protegido. Las rutas principales requieren sesión y redirigen a /login si no hay sesión válida.
- La barra lateral y el header se ocultan únicamente en la ruta /login para evitar confusión.

## 4) Gestión de usuarios (admin)
- Se agregó botón “Crear usuario” en la vista de Users, con su modal correspondiente.
- Se agregaron notificaciones (toast) para éxito y error en crear, editar rol y eliminar usuario.
- Se cambió la tabla para mostrar: nombre, rol, fecha de creación y acciones con íconos (editar/borrar).

## 5) Unicidad de email
- Al crear usuario se normaliza el email a minúsculas.
- La validación de duplicados es case‑insensitive.
- En login local también se busca el email con comparación case‑insensitive.

## 6) Actualización de contraseña
- Se agregó formulario modal desde el perfil del usuario.
- Requiere contraseña actual + nueva + confirmación.
- Se valida con Argon2 en backend antes de actualizar.
- Si el usuario no tiene contraseña local (Auth0‑only), se muestra error.

## 7) Componentes y archivos relevantes
- Users page: tabla, acciones y modales de crear/editar/eliminar.
- Modales: CreateUserModal, EditUserRoleModal, DeleteUserModal, ChangePasswordModal.
- Perfil: botón de cambiar contraseña junto a “Editar perfil”.
- Backend: nueva mutación changePassword y createUser.

## 8) Notas de configuración
- Para logout sin errores en Auth0, agregar Allowed Logout URLs en el tenant:
  - http://localhost:3000/login
  - https://tu-dominio/login
