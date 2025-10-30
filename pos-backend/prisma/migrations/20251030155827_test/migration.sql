-- AlterTable
ALTER TABLE "public"."stock_movements" ADD COLUMN     "relatedMovementId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_relatedMovementId_fkey" FOREIGN KEY ("relatedMovementId") REFERENCES "public"."stock_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
