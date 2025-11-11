/*
  Warnings:

  - You are about to drop the column `nostes` on the `CashBox` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."CashBox" DROP COLUMN "nostes",
ADD COLUMN     "difference" DOUBLE PRECISION,
ADD COLUMN     "expectedAmount" DOUBLE PRECISION,
ADD COLUMN     "observations" TEXT,
ADD COLUMN     "realClosedAmount" DOUBLE PRECISION;
