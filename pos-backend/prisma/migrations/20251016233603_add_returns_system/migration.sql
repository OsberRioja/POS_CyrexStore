-- CreateEnum
CREATE TYPE "public"."ReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."stock_movements" ADD COLUMN     "returnId" INTEGER;

-- CreateTable
CREATE TABLE "public"."returns" (
    "id" SERIAL NOT NULL,
    "saleId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "totalRefunded" DOUBLE PRECISION NOT NULL,
    "refundMethod" TEXT NOT NULL,
    "notes" TEXT,
    "status" "public"."ReturnStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."return_items" (
    "id" SERIAL NOT NULL,
    "returnId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityReturned" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "condition" TEXT,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "public"."returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."returns" ADD CONSTRAINT "returns_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."returns" ADD CONSTRAINT "returns_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."return_items" ADD CONSTRAINT "return_items_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "public"."returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."return_items" ADD CONSTRAINT "return_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
