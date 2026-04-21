-- Add country metadata fields
ALTER TABLE "public"."User"
  ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT '591',
  ADD COLUMN "country" TEXT NOT NULL DEFAULT 'Bolivia';

ALTER TABLE "public"."Provider"
  ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT '591',
  ADD COLUMN "country" TEXT NOT NULL DEFAULT 'Bolivia';

ALTER TABLE "public"."Cliente"
  ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT '591',
  ADD COLUMN "country" TEXT NOT NULL DEFAULT 'Bolivia',
  ADD COLUMN "phone" TEXT NOT NULL DEFAULT '';

-- Normalize phone values by stripping non-digits
UPDATE "public"."User"
SET "phone" = regexp_replace(COALESCE("phone", ''), '[^0-9]', '', 'g');

UPDATE "public"."Provider"
SET "phone" = regexp_replace(COALESCE("phone", ''), '[^0-9]', '', 'g');

UPDATE "public"."Cliente"
SET
  "telefono" = regexp_replace(COALESCE("telefono", ''), '[^0-9]', '', 'g'),
  "phone" = regexp_replace(COALESCE("telefono", ''), '[^0-9]', '', 'g');
