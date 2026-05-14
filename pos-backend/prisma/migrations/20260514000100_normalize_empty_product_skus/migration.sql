-- Treat missing SKUs as NULL so the (sku, branchId) unique index does not
-- reserve one empty-string SKU per branch.
UPDATE "public"."Product"
SET "sku" = NULL
WHERE "sku" IS NOT NULL
  AND BTRIM("sku") = '';
