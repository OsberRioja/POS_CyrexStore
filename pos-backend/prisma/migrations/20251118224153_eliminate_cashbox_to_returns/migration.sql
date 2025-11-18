/*
  Warnings:

  - You are about to drop the column `cashBoxId` on the `returns` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethodId` on the `returns` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."returns" DROP COLUMN "cashBoxId",
DROP COLUMN "paymentMethodId";
