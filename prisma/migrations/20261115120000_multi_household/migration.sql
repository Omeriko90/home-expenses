-- Multi-household: Household + Role + Invitation, householdId scoping on all
-- top-level data models. Hand-edited: columns start nullable, existing data is
-- backfilled into a default household, then NOT NULL is enforced.

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "householdId" TEXT NOT NULL,
    "invitedById" TEXT,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add householdId as NULLABLE first (tables have existing rows)
ALTER TABLE "User" ADD COLUMN "householdId" TEXT,
                   ADD COLUMN "role" "Role" NOT NULL DEFAULT 'MEMBER';
ALTER TABLE "Category" ADD COLUMN "householdId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "householdId" TEXT;
ALTER TABLE "BusinessMapping" ADD COLUMN "householdId" TEXT;
ALTER TABLE "Portfolio" ADD COLUMN "householdId" TEXT;
ALTER TABLE "Goal" ADD COLUMN "householdId" TEXT;

-- Backfill: one default household owns all pre-existing data; existing users
-- are the household owners -> ADMIN.
INSERT INTO "Household" ("id", "name")
SELECT 'hh_default', 'הבית שלנו'
WHERE EXISTS (
    SELECT 1 FROM "User"
    UNION SELECT 1 FROM "Category"
    UNION SELECT 1 FROM "Transaction"
    UNION SELECT 1 FROM "Portfolio"
    UNION SELECT 1 FROM "Goal"
    UNION SELECT 1 FROM "BusinessMapping"
);

UPDATE "User" SET "householdId" = 'hh_default', "role" = 'ADMIN';
UPDATE "Category" SET "householdId" = 'hh_default';
UPDATE "Transaction" SET "householdId" = 'hh_default';
UPDATE "BusinessMapping" SET "householdId" = 'hh_default';
UPDATE "Portfolio" SET "householdId" = 'hh_default';
UPDATE "Goal" SET "householdId" = 'hh_default';

-- Enforce NOT NULL now that rows are backfilled
ALTER TABLE "User" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "Transaction" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "BusinessMapping" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "Portfolio" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "Goal" ALTER COLUMN "householdId" SET NOT NULL;

-- DropIndex: global uniques/indexes replaced by per-household ones
DROP INDEX "BusinessMapping_pattern_key";
DROP INDEX "Category_name_key";
DROP INDEX "Category_type_idx";
DROP INDEX "Goal_year_idx";
DROP INDEX "Portfolio_name_group_key";
DROP INDEX "Transaction_year_month_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");
CREATE UNIQUE INDEX "Invitation_householdId_email_key" ON "Invitation"("householdId", "email");
CREATE UNIQUE INDEX "BusinessMapping_householdId_pattern_key" ON "BusinessMapping"("householdId", "pattern");
CREATE INDEX "Category_householdId_type_idx" ON "Category"("householdId", "type");
CREATE UNIQUE INDEX "Category_householdId_name_key" ON "Category"("householdId", "name");
CREATE INDEX "Goal_householdId_year_idx" ON "Goal"("householdId", "year");
CREATE UNIQUE INDEX "Portfolio_householdId_name_group_key" ON "Portfolio"("householdId", "name", "group");
CREATE INDEX "Transaction_householdId_year_month_idx" ON "Transaction"("householdId", "year", "month");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessMapping" ADD CONSTRAINT "BusinessMapping_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
