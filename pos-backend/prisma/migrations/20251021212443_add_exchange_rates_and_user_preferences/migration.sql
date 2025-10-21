-- CreateTable
CREATE TABLE "public"."exchange_rates" (
    "id" SERIAL NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "apiRate" DOUBLE PRECISION,
    "manualRate" DOUBLE PRECISION,
    "useManual" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_preferences" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredCurrency" TEXT NOT NULL DEFAULT 'BOB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_fromCurrency_toCurrency_key" ON "public"."exchange_rates"("fromCurrency", "toCurrency");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "public"."user_preferences"("userId");

-- AddForeignKey
ALTER TABLE "public"."user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
