-- AlterTable
ALTER TABLE "Holding" ADD COLUMN     "type" TEXT NOT NULL DEFAULT '';

-- Backfill types guessed from existing instrument names (fix misses in the UI).
UPDATE "Holding" SET "type" = 'קרן השתלמות' WHERE "type" = '' AND ("instrument" LIKE '%קה״ש%' OR "instrument" LIKE '%קה"ש%' OR "instrument" LIKE '%השתלמות%');
UPDATE "Holding" SET "type" = 'קרן פנסיה' WHERE "type" = '' AND ("instrument" LIKE '%פנסיה%' OR "instrument" LIKE '%פניסה%');
UPDATE "Holding" SET "type" = 'ביטוח מנהלים' WHERE "type" = '' AND "instrument" LIKE '%ביטוח מנהלים%';
UPDATE "Holding" SET "type" = 'ביטוח חיים' WHERE "type" = '' AND "instrument" LIKE '%ביטוח חיים%';
UPDATE "Holding" SET "type" = 'קופת גמל להשקעה' WHERE "type" = '' AND "instrument" LIKE '%גמל להשקעה%';
UPDATE "Holding" SET "type" = 'קופת גמל' WHERE "type" = '' AND "instrument" LIKE '%גמל%';
UPDATE "Holding" SET "type" = 'קרן כספית' WHERE "type" = '' AND "instrument" LIKE '%קרן חירום%';
UPDATE "Holding" SET "type" = 'תיק מסחר עצמאי' WHERE "type" = '' AND "instrument" LIKE 'תיק%';
UPDATE "Holding" SET "type" = 'חיסכון' WHERE "type" = '' AND ("instrument" LIKE '%חיסכון%' OR "instrument" LIKE '%בר מצווה%');
