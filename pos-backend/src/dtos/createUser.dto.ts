
export type RoleString = 'ADMIN' | 'SUPERVISOR' | 'SELLER';

export interface CreateUserDTO {
  userCode?: number; // Código de usuario
  name: string; // Nombre de usuario
  email: string; // Correo electrónico                              
  password: string; // Contraseña
  phone: string; // Teléfono (opcional)
  role: RoleString; // Rol del usuario
}