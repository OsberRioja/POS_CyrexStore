-- Add foreign key for existing column "createdBy" in sales table
ALTER TABLE "sales"
ADD CONSTRAINT "sales_createdBy_fkey"
FOREIGN KEY ("createdBy") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
