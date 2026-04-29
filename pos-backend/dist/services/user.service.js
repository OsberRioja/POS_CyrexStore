"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const user_repository_1 = require("../repositories/user.repository");
const userCode_1 = require("../utils/userCode");
const passwordGenerator_1 = require("../utils/passwordGenerator");
const email_service_1 = require("./email.service");
const env_1 = require("../env");
const phone_1 = require("../utils/phone");
const SALT_ROUNDS = 10;
const CREATE_RETRY = 5;
/** Helper: validar y parsear usercode recibido */
function parseAndValidateUsercode(input) {
    if (input === undefined || input === null)
        return undefined;
    const n = typeof input === "string" ? Number(input) : input;
    if (!Number.isInteger(n) || n < 1000 || n > 9999) {
        throw { status: 400, message: "usercode debe ser un número entero de 4 dígitos (1000-9999)" };
    }
    return n;
}
function mapRole(role) {
    if (!role)
        return "SELLER";
    switch (role.toLowerCase()) {
        case "admin": return "ADMIN";
        case "supervisor": return "SUPERVISOR";
        default: return "SELLER";
    }
}
function buildFullName(firstName, lastNamePaterno, lastNameMaterno) {
    return [firstName, lastNamePaterno, lastNameMaterno]
        .map((v) => v?.trim())
        .filter(Boolean)
        .join(' ');
}
// Validar formato de email (básico)
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
exports.UserService = {
    async createUser(dto, currentUserBranchId) {
        if (!dto.firstName || !dto.lastNamePaterno || !dto.lastNameMaterno || !dto.email || !dto.role || !dto.phone || !dto.countryCode || !dto.country) {
            throw { status: 400, message: "nombre, apellidos, email, rol, country, countryCode y phone son requeridos" };
        }
        const normalizedPhone = (0, phone_1.normalizePhoneNumber)(dto.phone);
        const normalizedCountryCode = (0, phone_1.normalizeCountryCode)(dto.countryCode);
        const normalizedCountry = dto.country.trim();
        (0, phone_1.validatePhoneOrThrow)(normalizedPhone, normalizedCountryCode, normalizedCountry);
        if (!isValidEmail(dto.email)) {
            throw { status: 400, message: "formato de email inválido" };
        }
        // Verificar si el email ya existe
        const existingEmail = await user_repository_1.UserRepository.findByEmail(dto.email);
        if (existingEmail) {
            throw { status: 409, message: "El email ya está registrado" };
        }
        const temporaryPassword = (0, passwordGenerator_1.generateTemporaryPassword)();
        const passwordHash = await bcryptjs_1.default.hash(temporaryPassword, SALT_ROUNDS);
        const role = mapRole(dto.role);
        // Determinar branchId para el nuevo usuario
        let userBranchId = null;
        // Si el usuario actual es administrador global (currentUserBranchId es null) y proporciona un branchId, usarlo
        if (currentUserBranchId === null && dto.branchId) {
            userBranchId = dto.branchId;
        }
        // Si el usuario actual tiene una sucursal (currentUserBranchId es un número), asignar esa sucursal
        else if (currentUserBranchId) {
            userBranchId = currentUserBranchId;
        }
        // Si el rol es ADMIN, puede ser global (branchId null)
        else if (role === 'ADMIN') {
            userBranchId = null;
        }
        // Para otros roles, debe tener sucursal. Si no se puede determinar, lanzar error.
        else {
            throw { status: 400, message: "No se puede determinar la sucursal para el usuario" };
        }
        // 1) Si el cliente envió usercode, parsear y validar.
        let providedUsercode;
        try {
            providedUsercode = parseAndValidateUsercode(dto.userCode);
        }
        catch (e) {
            throw e;
        }
        // 2) Si vino usercode, comprobar que no exista ya
        if (providedUsercode !== undefined) {
            const exists = await user_repository_1.UserRepository.findByUsercode(providedUsercode);
            if (exists) {
                throw { status: 409, message: `usercode ${providedUsercode} ya está en uso` };
            }
        }
        // 3) Si no vino usercode, generamos uno (y nos preparamos para reintentar si colisiona)
        let usercode = providedUsercode;
        if (usercode === undefined) {
            usercode = await (0, userCode_1.generateUniqueUsercode)();
        }
        // 4) Intentar crear (si fue provisto por el cliente y colisiona, devolvemos 409;
        //    si fue generado por nosotros, reintentamos en caso de P2002 por usercode).
        for (let attempt = 0; attempt < CREATE_RETRY; attempt++) {
            try {
                const fullName = buildFullName(dto.firstName, dto.lastNamePaterno, dto.lastNameMaterno);
                const user = await user_repository_1.UserRepository.create({
                    userCode: usercode,
                    name: fullName,
                    firstName: dto.firstName.trim(),
                    lastNamePaterno: dto.lastNamePaterno.trim(),
                    lastNameMaterno: dto.lastNameMaterno.trim(),
                    email: dto.email,
                    password: passwordHash, // enviar la contraseña ya hasheada
                    countryCode: normalizedCountryCode,
                    country: normalizedCountry,
                    phone: normalizedPhone ?? null,
                    role: role,
                    passwordChangeRequired: true,
                    branchId: userBranchId ?? undefined,
                });
                // Enviar email de invitación
                try {
                    const invitationData = {
                        userName: user.name,
                        userEmail: user.email,
                        temporaryPassword: temporaryPassword,
                        loginUrl: env_1.env.frontendUrl,
                        companyName: env_1.env.email.fromName || 'CYREX STORE',
                        adminName: 'Administrador del Sistema',
                    };
                    const emailSent = await email_service_1.emailService.sendInvitationEmail(invitationData);
                    if (emailSent) {
                        console.log(`📧 Email de invitación enviado a: ${user.email}`);
                    }
                    else {
                        console.warn(`⚠️ No se pudo enviar el email de invitación a: ${user.email}`);
                    }
                }
                catch (emailErr) {
                    console.error(`❌ Error al enviar email de invitación a ${user.email}:`, emailErr);
                }
                // limpiar password antes de devolver
                const { password, ...safeUser } = user;
                return {
                    ...safeUser,
                    emailSent: true,
                };
            }
            catch (err) {
                // Solo manejamos Prisma P2002 (unique constraint)
                if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                    const rawTarget = err.meta?.target ?? err.meta?.field_name;
                    // Normalizar target a string
                    const targetStr = Array.isArray(rawTarget) ? rawTarget.join(",") : String(rawTarget ?? "");
                    // Si la colisión es en usercode:
                    if (targetStr.includes("usercode")) {
                        // Si el usercode fue PROVEÍDO por el cliente, no lo reemplazamos: error 409
                        if (providedUsercode !== undefined) {
                            throw { status: 409, message: `usercode ${providedUsercode} ya registrado` };
                        }
                        // Si fue generado por nosotros, generamos otro y reintentamos
                        usercode = await (0, userCode_1.generateUniqueUsercode)();
                        continue;
                    }
                    // Si la colisión fue por email u otro campo único -> 409
                    if (targetStr.includes("email")) {
                        throw { status: 409, message: "Email ya registrado" };
                    }
                    // caso genérico: conflict
                    throw { status: 409, message: "Violación de unicidad (campo) " + targetStr };
                }
                // otro error: propagar como 500
                console.error("Error creacion usuario:", err);
                throw { status: 500, message: "Error interno al crear usuario" };
            }
        }
        // Si no conseguimos crear tras reintentos
        throw { status: 500, message: "No se pudo generar un usercode único. Intenta de nuevo." };
    },
    async listUsers(currentUserBranchId, queryBranchId) {
        const effectiveBranchId = currentUserBranchId ?? queryBranchId;
        return user_repository_1.UserRepository.findAll(effectiveBranchId);
    },
    async getUserById(id) {
        const u = await user_repository_1.UserRepository.findById(id);
        if (!u)
            throw { status: 404, message: "Usuario no encontrado" };
        return u;
    },
    async getByUserCode(usercode) {
        const u = await user_repository_1.UserRepository.findByUsercode(usercode);
        if (!u)
            throw { status: 404, message: "Codigo de Usuario no encontrado" };
        return u;
    },
    async getByEmail(email) {
        const u = await user_repository_1.UserRepository.findByEmail(email);
        if (!u)
            throw { status: 404, message: "Email no encontrado" };
        return u;
    },
    async getByName(name) {
        const u = await user_repository_1.UserRepository.findByName(name);
        if (!u)
            throw { status: 404, message: "Nombre no encontrado" };
        return u;
    },
    async updateUser(id, data) {
        // comprobar existencia
        const existing = await user_repository_1.UserRepository.findById(id);
        if (!existing)
            throw { status: 404, message: "Usuario no encontrado" };
        const updatedData = { ...data };
        if (data.password) {
            updatedData.password = await bcryptjs_1.default.hash(data.password, SALT_ROUNDS);
        }
        const firstName = (data.firstName ?? existing.firstName ?? '').trim();
        const lastNamePaterno = (data.lastNamePaterno ?? existing.lastNamePaterno ?? '').trim();
        const lastNameMaterno = (data.lastNameMaterno ?? existing.lastNameMaterno ?? '').trim();
        if (data.firstName !== undefined || data.lastNamePaterno !== undefined || data.lastNameMaterno !== undefined) {
            if (!firstName || !lastNamePaterno || !lastNameMaterno) {
                throw { status: 400, message: "nombre, apellido paterno y apellido materno son requeridos" };
            }
            updatedData.name = buildFullName(firstName, lastNamePaterno, lastNameMaterno);
            updatedData.firstName = firstName;
            updatedData.lastNamePaterno = lastNamePaterno;
            updatedData.lastNameMaterno = lastNameMaterno;
        }
        const mergedPhone = (0, phone_1.normalizePhoneNumber)(data.phone ?? existing.phone);
        const mergedCountryCode = (0, phone_1.normalizeCountryCode)(data.countryCode ?? existing.countryCode);
        const mergedCountry = (data.country ?? existing.country ?? "").trim();
        (0, phone_1.validatePhoneOrThrow)(mergedPhone, mergedCountryCode, mergedCountry);
        updatedData.phone = mergedPhone;
        updatedData.countryCode = mergedCountryCode;
        updatedData.country = mergedCountry;
        const user = await user_repository_1.UserRepository.updateUser(id, updatedData);
        if (!user)
            throw { status: 404, message: "Usuario no encontrado" };
        return user;
    },
    async deleteUser(id) {
        const user = await user_repository_1.UserRepository.deleteUser(id);
        if (!user)
            throw { status: 404, message: "Usuario no encontrado" };
        return user;
    },
};
