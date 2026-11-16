import { prisma } from "@/lib/db";

/** Distinct years present in the data, plus the current year, newest first. */
export async function getYears(householdId: string): Promise<number[]> {
  const [tx, bud] = await Promise.all([
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
  ]);
  const set = new Set<number>([
    ...tx.map((t) => t.year),
    ...bud.map((b) => b.year),
    new Date().getFullYear(),
  ]);
  return [...set].sort((a, b) => b - a);
}

export function resolveYear(
  years: number[],
  requested?: string | string[],
): number {
  const raw = Array.isArray(requested) ? requested[0] : requested;
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isNaN(parsed) && years.includes(parsed)) return parsed;
  return years[0] ?? new Date().getFullYear();
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
