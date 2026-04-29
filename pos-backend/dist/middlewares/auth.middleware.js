"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withBranchContext = exports.requireBranchAccess = exports.requireRole = exports.requirePermission = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../env");
const permissions_1 = require("../types/permissions");
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Token requerido" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Token malformado" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        // Guardar información del usuario en el request
        req.userId = decoded.sub ?? decoded.id ?? decoded.userId;
        req.user = {
            ...decoded,
            permissions: (0, permissions_1.getPermissionsForRole)(decoded.role),
            branchId: decoded.branchId
        };
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Token inválido o expirado" });
    }
};
exports.authMiddleware = authMiddleware;
// Middleware para verificar permisos específicos
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "No autenticado" });
        }
        const userPermissions = req.user.permissions || [];
        if (!userPermissions.includes(permission)) {
            return res.status(403).json({
                message: "No tienes permisos para esta acción"
            });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
// Middleware opcional para verificar roles específicos
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "No autenticado" });
        }
        const userRole = req.user.role;
        if (!roles.includes(userRole)) {
            return res.status(403).json({
                message: "No tienes permisos para esta acción"
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Middleware para verificar acceso a sucursal
const requireBranchAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "No autenticado" });
    }
    const userRole = req.user.role;
    const userBranchId = req.user.branchId;
    // Administradores globales (branchId = null) pueden acceder a todo
    if (userRole === 'ADMIN' && userBranchId === null) {
        return next();
    }
    // Para otros roles, deben tener un branchId asignado
    if (!userBranchId) {
        return res.status(403).json({
            message: 'Usuario no asignado a ninguna sucursal'
        });
    }
    next();
};
exports.requireBranchAccess = requireBranchAccess;
// NUEVO: Middleware para extraer/validar branchId de parámetros o body
const withBranchContext = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "No autenticado" });
    }
    const userBranchId = req.user.branchId;
    const userRole = req.user.role;
    // Si es administrador global, puede especificar branchId en query/body
    if (userRole === 'ADMIN' && userBranchId === null) {
        // Permitir override de branchId para admins
        const branchIdFromQuery = req.query.branchId ? Number(req.query.branchId) : undefined;
        const branchIdFromBody = req.body.branchId ? Number(req.body.branchId) : undefined;
        if (branchIdFromQuery || branchIdFromBody) {
            req.user.branchId = branchIdFromQuery || branchIdFromBody;
        }
        // Si no se especifica, el admin opera en "modo global"
    }
    next();
};
exports.withBranchContext = withBranchContext;
