"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireManagerForReturns = void 0;
const requireManagerForReturns = (req, res, next) => {
    const user = req.user;
    if (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR') {
        return res.status(403).json({
            error: 'Solo administradores y supervisores pueden procesar devoluciones'
        });
    }
    next();
};
exports.requireManagerForReturns = requireManagerForReturns;
