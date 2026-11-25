-- CreateEnum
CREATE TYPE "IncomeAmountType" AS ENUM ('NET', 'GROSS');

-- AlterTable
ALTER TABLE "IncomeEntry" ADD COLUMN     "grossAmount" DECIMAL(12,2),
ADD COLUMN     "linkedSourceId" TEXT,
ADD COLUMN     "taxBreakdown" JSONB;

-- AlterTable
ALTER TABLE "IncomeSource" ADD COLUMN     "amountType" "IncomeAmountType" NOT NULL DEFAULT 'NET',
ADD COLUMN     "creditPoints" DECIMAL(5,2) NOT NULL DEFAULT 2.25,
ADD COLUMN     "hishtalmutRate" DECIMAL(5,4),
ADD COLUMN     "pensionRate" DECIMAL(5,4);

-- AddForeignKey
ALTER TABLE "IncomeEntry" ADD CONSTRAINT "IncomeEntry_linkedSourceId_fkey" FOREIGN KEY ("linkedSourceId") REFERENCES "IncomeSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
