import { z } from "zod";
import { StringValue } from "ms";
import dotenv from "dotenv";

dotenv.config(); // Carga variables desde .env a process.env

// Definimos el esquema de validación
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),

  JWT_SECRET: z.string().min(1, "JWT_SECRET es requerido"),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+(s|m|h|d)$/, "Formato inválido para expiresIn (ej: 30m, 12h, 7d)")
    .transform((val) => val as StringValue),

  // Variables para configuración de email
  EMAIL_SERVICE: z.string().default("gmail"),
  EMAIL_HOST: z.string().default("smtp.gmail.com"),
  EMAIL_PORT: z.coerce.number().default(587),
  EMAIL_USER: z.string().email("EMAIL_USER debe ser un email válido").optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email("EMAIL_FROM debe ser un email válido").optional(),
  EMAIL_FROM_NAME: z.string().default("Cyrex Store").optional(),
  EMAIL_TESTING: z.enum(["true", "false"]).default("false"),
  EMAIL_TEST_RECIPIENT: z.string().email().optional(),
  // URL del frontend
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
});

// Validamos process.env al inicio
const validatedEnv = envSchema.parse(process.env);

// Exportamos la configuración con la estructura que necesitas
export const env = {
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

export default env;