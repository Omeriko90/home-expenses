-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('EXPENSE', 'INVESTMENT');

-- CreateEnum
CREATE TYPE "TxKind" AS ENUM ('FIXED', 'VARIABLE');

-- CreateEnum
CREATE TYPE "PortfolioGroup" AS ENUM ('MAIN', 'KIDS');

-- CreateEnum
CREATE TYPE "MappingMatch" AS ENUM ('EXACT', 'CONTAINS');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('NUMERIC', 'CHECKLIST');

-- CreateEnum
CREATE TYPE "GoalLinkKind" AS ENUM ('NONE', 'CATEGORY', 'INVESTMENT_TOTAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'he',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "type" "CategoryType" NOT NULL DEFAULT 'EXPENSE',
    "color" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "businessName" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "kind" "TxKind" NOT NULL DEFAULT 'VARIABLE',
    "rawBusinessName" TEXT,
    "rawFileCategory" TEXT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "note" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessMapping" (
    "id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "matchType" "MappingMatch" NOT NULL DEFAULT 'EXACT',
    "hitCount" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "BusinessMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "monthlyAmount" DECIMAL(12,2) NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" "PortfolioGroup" NOT NULL DEFAULT 'MAIN',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holding" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "house" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "portfolioId" TEXT NOT NULL,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioYear" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "deposits" DECIMAL(14,2) NOT NULL,
    "portfolioId" TEXT NOT NULL,

    CONSTRAINT "PortfolioYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoldingSnapshot" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "holdingId" TEXT NOT NULL,

    CONSTRAINT "HoldingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" "GoalType" NOT NULL DEFAULT 'NUMERIC',
    "note" TEXT,
    "targetAmount" DECIMAL(14,2),
    "currentAmount" DECIMAL(14,2),
    "linkKind" "GoalLinkKind" NOT NULL DEFAULT 'NONE',
    "linkCategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalMilestone" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "goalId" TEXT NOT NULL,

    CONSTRAINT "GoalMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_type_idx" ON "Category"("type");

-- CreateIndex
CREATE INDEX "Transaction_year_month_idx" ON "Transaction"("year", "month");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_year_idx" ON "Transaction"("categoryId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessMapping_pattern_key" ON "BusinessMapping"("pattern");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_categoryId_year_key" ON "Budget"("categoryId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_name_group_key" ON "Portfolio"("name", "group");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioYear_portfolioId_year_key" ON "PortfolioYear"("portfolioId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "HoldingSnapshot_holdingId_year_key" ON "HoldingSnapshot"("holdingId", "year");

-- CreateIndex
CREATE INDEX "Goal_year_idx" ON "Goal"("year");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMapping" ADD CONSTRAINT "BusinessMapping_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioYear" ADD CONSTRAINT "PortfolioYear_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoldingSnapshot" ADD CONSTRAINT "HoldingSnapshot_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "Holding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_linkCategoryId_fkey" FOREIGN KEY ("linkCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalMilestone" ADD CONSTRAINT "GoalMilestone_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
