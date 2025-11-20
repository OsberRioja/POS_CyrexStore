-- CreateEnum
CREATE TYPE "public"."CommissionType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE', 'TIERED_RANGES');

-- CreateEnum
CREATE TYPE "public"."CommissionRangeType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateTable
CREATE TABLE "public"."CommissionConfig" (
    "id" TEXT NOT NULL,
    "type" "public"."CommissionType" NOT NULL DEFAULT 'FIXED_AMOUNT',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "fixedAmount" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "CommissionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommissionRange" (
    "id" SERIAL NOT NULL,
    "configId" TEXT NOT NULL,
    "minAmount" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION,
    "commissionValue" DOUBLE PRECISION NOT NULL,
    "commissionType" "public"."CommissionRangeType" NOT NULL DEFAULT 'FIXED',

    CONSTRAINT "CommissionRange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."commissions" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commissions_saleId_userId_key" ON "public"."commissions"("saleId", "userId");

-- AddForeignKey
ALTER TABLE "public"."CommissionConfig" ADD CONSTRAINT "CommissionConfig_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommissionRange" ADD CONSTRAINT "CommissionRange_configId_fkey" FOREIGN KEY ("configId") REFERENCES "public"."CommissionConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commissions" ADD CONSTRAINT "commissions_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commissions" ADD CONSTRAINT "commissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
