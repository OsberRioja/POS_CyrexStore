-- Cambiar unicidad global por unicidad por sucursal para productos maestro replicados
-- Compatibilidad con distintos estados de DB (constraint/index legado)
ALTER TABLE "public"."Product" DROP CONSTRAINT IF EXISTS "Product_sku_key";
DROP INDEX IF EXISTS "public"."Product_sku_key";
DROP INDEX IF EXISTS "Product_sku_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Product_sku_branchId_key" ON "public"."Product"("sku", "branchId");
