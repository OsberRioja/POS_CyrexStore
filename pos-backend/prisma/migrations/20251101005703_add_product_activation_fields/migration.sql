-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "deactivatedBy" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
