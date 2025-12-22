-- AlterEnum
ALTER TYPE "public"."CashBoxStatus" ADD VALUE 'REOPENED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."MovementType" ADD VALUE 'INTERNAL_USE_OUT';
ALTER TYPE "public"."MovementType" ADD VALUE 'INTERNAL_USE_RETURN';

-- AlterTable
ALTER TABLE "public"."CashBox" ADD COLUMN     "reopenedAt" TIMESTAMP(3),
ADD COLUMN     "reopenedById" TEXT;

-- AlterTable
ALTER TABLE "public"."stock_movements" ADD COLUMN     "branchId" INTEGER,
ADD COLUMN     "destination" TEXT,
ADD COLUMN     "expectedReturnDate" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "public"."CashBox" ADD CONSTRAINT "CashBox_reopenedById_fkey" FOREIGN KEY ("reopenedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
