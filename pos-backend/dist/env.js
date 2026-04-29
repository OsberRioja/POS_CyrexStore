"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Carga variables desde .env a process.env
// Definimos el esquema de validación
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    PORT: zod_1.z.coerce.number().default(3000),
    JWT_SECRET: zod_1.z.string().min(1, "JWT_SECRET es requerido"),
    JWT_EXPIRES_IN: zod_1.z
        .string()
        .regex(/^\d+(s|m|h|d)$/, "Formato inválido para expiresIn (ej: 30m, 12h, 7d)")
        .transform((val) => val),
    // Variables para configuración de email
    EMAIL_SERVICE: zod_1.z.string().default("gmail"),
    EMAIL_HOST: zod_1.z.string().default("smtp.gmail.com"),
    EMAIL_PORT: zod_1.z.coerce.number().default(587),
    EMAIL_USER: zod_1.z.string().email("EMAIL_USER debe ser un email válido").optional(),
    EMAIL_PASS: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().email("EMAIL_FROM debe ser un email válido").optional(),
    EMAIL_FROM_NAME: zod_1.z.string().default("Cyrex Store").optional(),
    EMAIL_TESTING: zod_1.z.enum(["true", "false"]).default("false"),
    EMAIL_TEST_RECIPIENT: zod_1.z.string().email().optional(),
    // URL del frontend
    FRONTEND_URL: zod_1.z.string().url().default("http://localhost:5173"),
});
// Validamos process.env al inicio
const validatedEnv = envSchema.parse(process.env);
// Exportamos la configuración con la estructura que necesitas
exports.env = {
    ...validatedEnv,
    // Configuración de Email estructurada
    email: {
        service: validatedEnv.EMAIL_SERVICE,
        host: validatedEnv.EMAIL_HOST,
        port: validatedEnv.EMAIL_PORT,
        user: validatedEnv.EMAIL_USER,
        pass: validatedEnv.EMAIL_PASS,
        from: validatedEnv.EMAIL_FROM,
        fromName: validatedEnv.EMAIL_FROM_NAME,
        testing: validatedEnv.EMAIL_TESTING === "true",
        testRecipient: validatedEnv.EMAIL_TEST_RECIPIENT,
    },
    frontendUrl: validatedEnv.FRONTEND_URL,
};
exports.default = exports.env;
