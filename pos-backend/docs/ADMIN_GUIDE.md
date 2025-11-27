# Guía del Administrador - Sistema de Autenticación

## Gestión de Usuarios

### Crear Nuevo Usuario
1. Ir a la sección "Usuarios"
2. Hacer clic en "Nuevo Usuario"
3. Completar:
   - Nombre completo
   - Email válido
   - Teléfono
   - Rol (Vendedor/Supervisor/Administrador)
   - Código de usuario (opcional - se genera automáticamente)

**Nota:** No es necesario poner contraseña. El sistema genera una automáticamente y la envía por email.

### Flujo del Usuario Nuevo
1. Recibe email con credenciales temporales
2. Primer login obliga a cambiar contraseña
3. Puede acceder al sistema con nueva contraseña

### Recuperación de Contraseña
- Los usuarios pueden usar "¿Olvidaste tu contraseña?" en el login
- Reciben un enlace válido por 1 hora
- Pueden establecer nueva contraseña segura

## Seguridad

### Contraseñas
- Mínimo 8 caracteres
- Letras mayúsculas y minúsculas
- Números
- Caracteres especiales
- No reutilizar contraseñas anteriores

### Tokens
- Los tokens de recuperación expiran en 1 hora
- Se limpian automáticamente cada 24 horas
- Solo pueden usarse una vez

## Solución de Problemas

### Usuario no puede iniciar sesión
1. Verificar que el email esté correcto
2. Usar "¿Olvidaste tu contraseña?" si no recuerda
3. Contactar al administrador si persiste

### Email no llega
1. Verificar carpeta de spam
2. Confirmar que el email esté correcto en el sistema
3. Reenviar invitación desde la gestión de usuarios

### Error al eliminar usuario
- No se pueden eliminar usuarios con registros relacionados
- Usar "desactivar" en lugar de eliminar