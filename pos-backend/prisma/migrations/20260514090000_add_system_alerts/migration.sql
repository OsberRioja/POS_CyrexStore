-- CreateTable
CREATE TABLE "SystemAlert" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "referenceId" INTEGER,
    "branchId" INTEGER,
    "createdBy" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemAlert_type_idx" ON "SystemAlert"("type");

-- CreateIndex
CREATE INDEX "SystemAlert_isRead_createdAt_idx" ON "SystemAlert"("isRead", "createdAt");

-- CreateIndex
CREATE INDEX "SystemAlert_branchId_idx" ON "SystemAlert"("branchId");

-- AddForeignKey
ALTER TABLE "SystemAlert" ADD CONSTRAINT "SystemAlert_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemAlert" ADD CONSTRAINT "SystemAlert_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
