export type RoleString = 'ADMIN' | 'SUPERVISOR' | 'SELLER';

export interface CreateUserDTO {
  userCode?: number; // Código de usuario
  name?: string; // compatibilidad hacia atrás
  firstName: string;
  lastNamePaterno: string;
  lastNameMaterno: string;
  email: string; // Correo electrónico
  password?: string; // Contraseña
  phone: string; // Teléfono
  role: RoleString; // Rol del usuario
  branchId?: number; // ID de la sucursal asignada (opcional)
}
