-- CreateEnum
CREATE TYPE "PlannedItemType" AS ENUM ('ONE_TIME', 'RECURRING', 'INSTALLMENTS');

-- CreateEnum
CREATE TYPE "PlannedItemStatus" AS ENUM ('ACTIVE', 'DONE', 'CANCELLED');

-- CreateTable
CREATE TABLE "PlannedItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "PlannedItemType" NOT NULL,
    "status" "PlannedItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "amount" DECIMAL(12,2) NOT NULL,
    "installments" INTEGER,
    "startYear" INTEGER NOT NULL,
    "startMonth" INTEGER NOT NULL,
    "endYear" INTEGER,
    "endMonth" INTEGER,
    "note" TEXT,
    "categoryId" TEXT,
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlannedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlannedItem_householdId_status_idx" ON "PlannedItem"("householdId", "status");

-- AddForeignKey
ALTER TABLE "PlannedItem" ADD CONSTRAINT "PlannedItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedItem" ADD CONSTRAINT "PlannedItem_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
