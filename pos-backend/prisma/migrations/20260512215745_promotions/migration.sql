-- AlterTable
ALTER TABLE "public"."_ProductToPromotion" ADD CONSTRAINT "_ProductToPromotion_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_ProductToPromotion_AB_unique";

-- CreateTable
CREATE TABLE "public"."_PromotionToProvider" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PromotionToProvider_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_PromotionToSale" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PromotionToSale_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PromotionToProvider_B_index" ON "public"."_PromotionToProvider"("B");

-- CreateIndex
CREATE INDEX "_PromotionToSale_B_index" ON "public"."_PromotionToSale"("B");

-- AddForeignKey
ALTER TABLE "public"."_PromotionToProvider" ADD CONSTRAINT "_PromotionToProvider_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PromotionToProvider" ADD CONSTRAINT "_PromotionToProvider_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Provider"("id_provider") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PromotionToSale" ADD CONSTRAINT "_PromotionToSale_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PromotionToSale" ADD CONSTRAINT "_PromotionToSale_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
