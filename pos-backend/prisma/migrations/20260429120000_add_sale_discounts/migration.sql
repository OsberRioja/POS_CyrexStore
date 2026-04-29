-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "sales"
ADD COLUMN "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "globalDiscountType" "DiscountType",
ADD COLUMN "globalDiscountValue" DOUBLE PRECISION,
ADD COLUMN "globalDiscountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sale_items"
ADD COLUMN "discountType" "DiscountType",
ADD COLUMN "discountValue" DOUBLE PRECISION,
ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
