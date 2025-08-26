-- CreateEnum
CREATE TYPE "public"."TipoCliente" AS ENUM ('PERSONA', 'EMPRESA');

-- CreateTable
CREATE TABLE "public"."Cliente" (
    "id_cliente" SERIAL NOT NULL,
    "tipo_cliente" "public"."TipoCliente" NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "genero" TEXT,
    "fecha_nacimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id_cliente")
);
