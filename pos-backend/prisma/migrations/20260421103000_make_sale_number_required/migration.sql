UPDATE "sales"
SET "saleNumber" = nextval(pg_get_serial_sequence('"sales"', 'saleNumber'))
WHERE "saleNumber" IS NULL;

ALTER TABLE "sales"
ALTER COLUMN "saleNumber" SET NOT NULL;
