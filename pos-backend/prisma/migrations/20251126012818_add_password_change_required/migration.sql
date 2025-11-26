-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "passwordChangeRequired" BOOLEAN NOT NULL DEFAULT false;
