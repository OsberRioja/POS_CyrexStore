export const Permission = {
  // Productos
  PRODUCT_READ: 'product:read',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  PRODUCT_TOGGLE_ACTIVE: 'product:toggle_active',
  
  // Ventas
  SALE_CREATE: 'sale:create',
  SALE_READ: 'sale:read',
  SALE_READ_ALL: 'sale:read_all',
  SALE_REFUND: 'sale:refund',
  
  // Caja
  CASHBOX_OPEN_CLOSE: 'cashbox:open_close',
  CASHBOX_READ: 'cashbox:read',
  CASHBOX_READ_ALL: 'cashbox:read_all',
  
  // Clientes
  CLIENT_READ: 'client:read',
  CLIENT_CREATE: 'client:create',
  CLIENT_UPDATE: 'client:update',
  CLIENT_DELETE: 'client:delete',
  
  // Proveedores
  PROVIDER_READ: 'provider:read',
  PROVIDER_CREATE: 'provider:create',
  PROVIDER_UPDATE: 'provider:update',
  PROVIDER_DELETE: 'provider:delete',
  
  // Usuarios
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Inventario
  INVENTORY_READ: 'inventory:read',
  INVENTORY_MANAGE: 'inventory:manage',
  
  // Reportes
  REPORT_READ: 'report:read',
} as const;

// Crear un tipo para los permisos
export type PermissionType = typeof Permission[keyof typeof Permission];

// Permisos por rol (actualizado para usar PermissionType)
export const ROLE_PERMISSIONS: Record<string, PermissionType[]> = {
  ADMIN: Object.values(Permission),
  
  SUPERVISOR: [
    Permission.PRODUCT_READ,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_TOGGLE_ACTIVE,
    Permission.SALE_CREATE,
    Permission.SALE_READ,
    Permission.SALE_READ_ALL,
    Permission.CASHBOX_OPEN_CLOSE,
    Permission.CASHBOX_READ,
    Permission.CLIENT_READ,
    Permission.CLIENT_CREATE,
    Permission.CLIENT_UPDATE,
    Permission.PROVIDER_READ,
    Permission.PROVIDER_CREATE,
    Permission.PROVIDER_UPDATE,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_MANAGE,
    Permission.REPORT_READ,
  ],
  SELLER: [
    Permission.PRODUCT_READ,
    Permission.SALE_CREATE,
    Permission.SALE_READ,
    Permission.CLIENT_READ,
    Permission.CLIENT_CREATE,
  ],
};

export function getPermissionsForRole(role: string): PermissionType[] {
  return ROLE_PERMISSIONS[role] || [];
}