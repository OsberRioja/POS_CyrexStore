-- Cambiar unicidad global por unicidad por sucursal para productos maestro replicados
DROP INDEX IF EXISTS "public"."Product_sku_key";

CREATE UNIQUE INDEX "Product_sku_branchId_key" ON "public"."Product"("sku", "branchId");
