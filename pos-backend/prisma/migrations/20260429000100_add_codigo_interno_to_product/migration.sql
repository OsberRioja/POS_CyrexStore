-- Hacer SKU opcional y agregar codigoInterno único obligatorio
ALTER TABLE "public"."Product"
  ALTER COLUMN "sku" DROP NOT NULL,
  ADD COLUMN "codigoInterno" TEXT;

-- Poblar registros existentes con un código de 7 dígitos único
WITH numbered AS (
  SELECT id, LPAD((ROW_NUMBER() OVER (ORDER BY "createdAt") % 10000000)::text, 7, '0') AS generated_code
  FROM "public"."Product"
)
UPDATE "public"."Product" p
SET "codigoInterno" = n.generated_code
FROM numbered n
WHERE p.id = n.id;

ALTER TABLE "public"."Product"
  ALTER COLUMN "codigoInterno" SET NOT NULL;

CREATE UNIQUE INDEX "Product_codigoInterno_branchId_key" ON "public"."Product"("codigoInterno", "branchId");
