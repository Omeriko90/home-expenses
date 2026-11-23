-- Replace manual sortOrder ordering with createdAt on Category, Portfolio,
-- Holding and GoalMilestone. createdAt is backfilled staggered by the old
-- sortOrder so the current display order is preserved exactly.

-- Category
ALTER TABLE "Category" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Category" SET "createdAt" = CURRENT_TIMESTAMP + ("sortOrder" * interval '1 second');
ALTER TABLE "Category" DROP COLUMN "sortOrder";

-- Portfolio
ALTER TABLE "Portfolio" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Portfolio" SET "createdAt" = CURRENT_TIMESTAMP + ("sortOrder" * interval '1 second');
ALTER TABLE "Portfolio" DROP COLUMN "sortOrder";

-- Holding
ALTER TABLE "Holding" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Holding" SET "createdAt" = CURRENT_TIMESTAMP + ("sortOrder" * interval '1 second');
ALTER TABLE "Holding" DROP COLUMN "sortOrder";

-- GoalMilestone
ALTER TABLE "GoalMilestone" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "GoalMilestone" SET "createdAt" = CURRENT_TIMESTAMP + ("sortOrder" * interval '1 second');
ALTER TABLE "GoalMilestone" DROP COLUMN "sortOrder";
