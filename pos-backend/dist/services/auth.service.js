"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
exports.generarToken = generarToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../env");
const user_repository_1 = require("../repositories/user.repository");
function generarToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    });
}
exports.AuthService = {
    async login(login, password) {
        let user = null;
        // determinar si login es email o usercode
        if (/^\d+$/.test(login)) {
            // Es un código de usuario (solo números)
            const userCode = parseInt(login, 10);
            user = await user_repository_1.UserRepository.findByUsercode(userCode);
        }
        else {
            // Es un email
            user = await user_repository_1.UserRepository.findByEmail(login);
        }
        if (!user)
            throw { status: 401, message: "Credenciales inválidas" };
        const match = await bcryptjs_1.default.compare(password, user.password);
        console.log("login attempt for:", login);
        console.log("stored password:", user.password);
        if (!match)
            throw { status: 401, message: "Credenciales inválidas" };
        // construir payload y firmar token
        const payload = {
            sub: user.id,
            role: user.role,
            email: user.email,
            name: user.name,
            userCode: user.userCode, // Añadido para tener el código disponible
            branchId: user.branchId,
        };
        const token = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
        // devolver token + user (sin password) + informacion de cambio de contraseña
        const { password: _p, ...userSafe } = user;
        // Informacion de sucursal en la respuesta
        let branchInfo = null;
        if (user.branchId) {
            // SI es necesario cargar info de sucursal, hacerlo aqui
            branchInfo = {
                id: user.branchId,
                // podemos agregar mas info si es necesario
            };
        }
        return {
            token,
            user: {
                ...userSafe,
                branchId: user.branchId,
            },
            requiresPasswordChange: user.passwordChangeRequired,
            branch: branchInfo
        };
    },
    verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
    },
};
