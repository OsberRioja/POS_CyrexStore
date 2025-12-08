-- AlterTable
ALTER TABLE "public"."sale_items" ADD COLUMN     "conversionRate" DOUBLE PRECISION,
ADD COLUMN     "originalCurrency" TEXT,
ADD COLUMN     "originalPrice" DOUBLE PRECISION;
