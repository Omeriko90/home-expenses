import { prisma } from "@/lib/db";

/** Distinct years present in the data, plus the current year, newest first. */
export async function getYears(householdId: string): Promise<number[]> {
  const [
    transactionYears,
    budgetYears,
    incomeEntryYears,
    incomeSourceEndYears,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: { householdId },
      distinct: ["year"],
      select: { year: true },
    }),
    prisma.budget.findMany({
      where: { category: { householdId } },
      distinct: ["year"],
      select: { year: true },
    }),
    prisma.incomeEntry.findMany({
      where: { householdId },
      distinct: ["year"],
      select: { year: true },
    }),
    prisma.incomeSource.findMany({
      where: { householdId, endYear: { not: null } },
      distinct: ["endYear"],
      select: { endYear: true },
    }),
  ]);
  const set = new Set<number>([
    ...transactionYears.map((t) => t.year),
    ...budgetYears.map((b) => b.year),
    ...incomeEntryYears.map((e) => e.year),
    ...incomeSourceEndYears.map((s) => s.endYear as number),
    new Date().getFullYear(),
  ]);
  return [...set].sort((a, b) => b - a);
}

export function getPlanningYear(): number | null {
  const now = new Date();
  return now.getMonth() === 11 && now.getDate() >= 16
    ? now.getFullYear() + 1
    : null;
}

export function withYear(years: number[], extra: number | null): number[] {
  if (extra === null || years.includes(extra)) return years;
  return [...years, extra].sort((a, b) => b - a);
}

export function resolveYear(
  years: number[],
  requested?: string | string[],
): number {
  const raw = Array.isArray(requested) ? requested[0] : requested;
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isNaN(parsed) && years.includes(parsed)) return parsed;
  const current = new Date().getFullYear();
  if (years.includes(current)) return current;
  return years[0] ?? current;
}

/** Resolve a year from the URL, accepting any sane value (free navigation). */
export function resolveYearLoose(
  requested?: string | string[],
  fallback: number = new Date().getFullYear(),
): number {
  const raw = Array.isArray(requested) ? requested[0] : requested;
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isNaN(parsed) && parsed >= 2000 && parsed <= 2100) return parsed;
  return fallback;
}

/**
 * Resolve the selected month (1-12): the requested one if valid; otherwise the
 * current month (for the current year), else the latest month that has data.
 */
export function resolveMonth(
  monthsWithData: number[],
  year: number,
  requested?: string | string[],
): number {
  const raw = Array.isArray(requested) ? requested[0] : requested;
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 12) return parsed;
  const now = new Date();
  if (year === now.getFullYear()) return now.getMonth() + 1; // default: current month
  if (monthsWithData.length) return Math.max(...monthsWithData);
  return 12;
}
