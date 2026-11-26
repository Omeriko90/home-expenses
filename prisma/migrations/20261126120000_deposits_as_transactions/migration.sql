-- DropForeignKey
ALTER TABLE "PortfolioYear" DROP CONSTRAINT "PortfolioYear_portfolioId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "portfolioId" TEXT;

-- DropTable
DROP TABLE "PortfolioYear";

-- CreateIndex
CREATE INDEX "Transaction_portfolioId_year_idx" ON "Transaction"("portfolioId", "year");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
