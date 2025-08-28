/*
  Warnings:

  - The `providerId` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Provider` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the `Proveedor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_providerId_fkey";

-- DropIndex
DROP INDEX "public"."Provider_name_key";

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "providerId",
ADD COLUMN     "providerId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Provider" DROP CONSTRAINT "Provider_pkey",
DROP COLUMN "id",
ADD COLUMN     "id_provider" SERIAL NOT NULL,
ADD CONSTRAINT "Provider_pkey" PRIMARY KEY ("id_provider");

-- DropTable
DROP TABLE "public"."Proveedor";

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."Provider"("id_provider") ON DELETE SET NULL ON UPDATE CASCADE;
