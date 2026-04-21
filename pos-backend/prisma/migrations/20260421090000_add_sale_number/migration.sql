ALTER TABLE "sales"
ADD COLUMN "saleNumber" SERIAL;

CREATE UNIQUE INDEX "sales_saleNumber_key" ON "sales"("saleNumber");
