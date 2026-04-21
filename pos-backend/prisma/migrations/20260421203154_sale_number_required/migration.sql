/*
  Warnings:

  - Made the column `saleNumber` on table `sales` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."sales" ALTER COLUMN "saleNumber" SET NOT NULL;
