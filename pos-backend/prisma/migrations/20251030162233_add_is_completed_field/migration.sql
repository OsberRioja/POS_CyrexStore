/*
  Warnings:

  - You are about to drop the column `relatedMovementId` on the `stock_movements` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."stock_movements" DROP CONSTRAINT "stock_movements_relatedMovementId_fkey";

-- AlterTable
ALTER TABLE "public"."stock_movements" DROP COLUMN "relatedMovementId",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedBy" TEXT,
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;
