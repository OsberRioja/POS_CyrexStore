"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.Permission = void 0;
exports.getPermissionsForRole = getPermissionsForRole;
var Permission;
(function (Permission) {
    // Productos
    Permission["PRODUCT_READ"] = "product:read";
    Permission["PRODUCT_CREATE"] = "product:create";
    Permission["PRODUCT_UPDATE"] = "product:update";
    Permission["PRODUCT_DELETE"] = "product:delete";
    Permission["PRODUCT_TOGGLE_ACTIVE"] = "product:toggle_active";
    // Ventas
    Permission["SALE_CREATE"] = "sale:create";
    Permission["SALE_READ"] = "sale:read";
    Permission["SALE_READ_ALL"] = "sale:read_all";
    Permission["SALE_REFUND"] = "sale:refund";
    // Caja
    Permission["CASHBOX_OPEN_CLOSE"] = "cashbox:open_close";
    Permission["CASHBOX_READ"] = "cashbox:read";
    Permission["CASHBOX_READ_ALL"] = "cashbox:read_all";
    // Clientes
    Permission["CLIENT_READ"] = "client:read";
    Permission["CLIENT_CREATE"] = "client:create";
    Permission["CLIENT_UPDATE"] = "client:update";
    Permission["CLIENT_DELETE"] = "client:delete";
    // Proveedores
    Permission["PROVIDER_READ"] = "provider:read";
    Permission["PROVIDER_CREATE"] = "provider:create";
    Permission["PROVIDER_UPDATE"] = "provider:update";
    Permission["PROVIDER_DELETE"] = "provider:delete";
    // Usuarios
    Permission["USER_READ"] = "user:read";
    Permission["USER_CREATE"] = "user:create";
    Permission["USER_UPDATE"] = "user:update";
    Permission["USER_DELETE"] = "user:delete";
    // Inventario
    Permission["INVENTORY_READ"] = "inventory:read";
    Permission["INVENTORY_MANAGE"] = "inventory:manage";
    // Reportes
    Permission["REPORT_READ"] = "report:read";
    //Sucursales
    Permission["BRANCH_READ"] = "branch:read";
    Permission["BRANCH_CREATE"] = "branch:create";
    Permission["BRANCH_UPDATE"] = "branch:update";
    Permission["BRANCH_DELETE"] = "branch:delete";
})(Permission || (exports.Permission = Permission = {}));
// Permisos por rol
exports.ROLE_PERMISSIONS = {
    ADMIN: Object.values(Permission), // Todos los permisos
    SUPERVISOR: [
        // Productos
        Permission.PRODUCT_READ,
        Permission.PRODUCT_CREATE,
        Permission.PRODUCT_UPDATE,
        Permission.PRODUCT_TOGGLE_ACTIVE,
        // Ventas
        Permission.SALE_CREATE,
        Permission.SALE_READ,
        Permission.SALE_READ_ALL,
        // Caja
        Permission.CASHBOX_OPEN_CLOSE,
        Permission.CASHBOX_READ,
        Permission.CASHBOX_READ_ALL,
        //Usuarios
        Permission.USER_READ,
        // Clientes
        Permission.CLIENT_READ,
        Permission.CLIENT_CREATE,
        Permission.CLIENT_UPDATE,
        // Proveedores
        Permission.PROVIDER_READ,
        Permission.PROVIDER_CREATE,
        Permission.PROVIDER_UPDATE,
        // Inventario
        Permission.INVENTORY_READ,
        Permission.INVENTORY_MANAGE,
        // Reportes
        Permission.REPORT_READ,
        // Sucursales
        Permission.BRANCH_READ,
    ],
    SELLER: [
        // Productos
        Permission.PRODUCT_READ,
        // Ventas
        Permission.SALE_CREATE,
        Permission.SALE_READ, // Solo sus propias ventas
        // Clientes
        Permission.CLIENT_READ,
        Permission.CLIENT_CREATE,
    ],
};
function getPermissionsForRole(role) {
    return exports.ROLE_PERMISSIONS[role] || [];
}
