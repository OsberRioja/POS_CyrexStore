// env.ts
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
});

// Validamos process.env al inicio
export const env = envSchema.parse(process.env);

export default env;