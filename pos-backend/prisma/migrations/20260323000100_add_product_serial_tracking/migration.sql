-- Add serial tracking to stock movements and sale items
ALTER TABLE "stock_movements"
ADD COLUMN "serialNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "stock_movements"
SET "serialNumbers" = ARRAY[]::TEXT[]
WHERE "serialNumbers" IS NULL;

ALTER TABLE "stock_movements"
ALTER COLUMN "serialNumbers" SET NOT NULL;

ALTER TABLE "sale_items"
ADD COLUMN "serialNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "sale_items"
SET "serialNumbers" = ARRAY[]::TEXT[]
WHERE "serialNumbers" IS NULL;

ALTER TABLE "sale_items"
ALTER COLUMN "serialNumbers" SET NOT NULL;

-- Create product serial inventory table
CREATE TYPE "ProductSerialStatus" AS ENUM ('AVAILABLE', 'SOLD');

CREATE TABLE "product_serials" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "saleId" TEXT,
    "serialNumber" TEXT NOT NULL,
    "status" "ProductSerialStatus" NOT NULL DEFAULT 'AVAILABLE',
    "unitCost" DOUBLE PRECISION,
    "providerId" INTEGER,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_serials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_serials_serialNumber_key" ON "product_serials"("serialNumber");
CREATE INDEX "product_serials_productId_status_idx" ON "product_serials"("productId", "status");
CREATE INDEX "product_serials_saleId_idx" ON "product_serials"("saleId");

ALTER TABLE "product_serials" ADD CONSTRAINT "product_serials_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_serials" ADD CONSTRAINT "product_serials_saleId_fkey"
FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_serials" ADD CONSTRAINT "product_serials_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "Provider"("id_provider") ON DELETE SET NULL ON UPDATE CASCADE;
