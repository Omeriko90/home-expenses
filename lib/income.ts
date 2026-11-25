import { prisma } from "@/lib/db";
import type { TaxBreakdown } from "@/lib/tax/types";
import {
  resolveMonthIncome,
  type IncomeEntryData,
  type IncomeSourceData,
  type ResolvedMonthIncome,
} from "@/lib/income-resolve";

export type { IncomeEntryData, IncomeSourceData, ResolvedMonthIncome };
export { resolveMonthIncome };

export async function fetchIncomeData(householdId: string): Promise<{
  sources: IncomeSourceData[];
  entries: IncomeEntryData[];
}> {
  const [sources, entries] = await Promise.all([
    prisma.incomeSource.findMany({
      where: { householdId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        endYear: true,
        endMonth: true,
        amountType: true,
        creditPoints: true,
        pensionRate: true,
        hishtalmutRate: true,
        hishtalmutCapped: true,
      },
    }),
    prisma.incomeEntry.findMany({
      where: { householdId },
      orderBy: [{ year: "asc" }, { month: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        kind: true,
        name: true,
        year: true,
        month: true,
        amount: true,
        grossAmount: true,
        taxBreakdown: true,
        linkedSourceId: true,
        note: true,
        sourceId: true,
      },
    }),
  ]);
  return {
    sources: sources.map((source) => ({
      ...source,
      creditPoints: Number(source.creditPoints),
      pensionRate:
        source.pensionRate === null ? null : Number(source.pensionRate),
      hishtalmutRate:
        source.hishtalmutRate === null ? null : Number(source.hishtalmutRate),
    })),
    entries: entries.map((entry) => ({
      ...entry,
      amount: Number(entry.amount),
      grossAmount:
        entry.grossAmount === null ? null : Number(entry.grossAmount),
      taxBreakdown: entry.taxBreakdown as TaxBreakdown | null,
    })),
  };
}

/** Full resolved breakdown for one month (income page). */
export async function getMonthIncome(
  householdId: string,
  year: number,
  month: number,
): Promise<ResolvedMonthIncome> {
  const { sources, entries } = await fetchIncomeData(householdId);
  return resolveMonthIncome(sources, entries, year, month);
}

/** Resolved income for all 12 months of a year (year grid, dashboard). */
export async function getYearIncome(
  householdId: string,
  year: number,
): Promise<ResolvedMonthIncome[]> {
  const { sources, entries } = await fetchIncomeData(householdId);
  return Array.from({ length: 12 }, (_, i) =>
    resolveMonthIncome(sources, entries, year, i + 1),
  );
}

/**
 * Expected household income for a given month — the seam the forecast and
 * planning UI consume. 0 means "no income set up for this month".
 */
export async function getExpectedMonthlyIncome(
  householdId: string,
  year: number,
  month: number,
): Promise<number> {
  return (await getMonthIncome(householdId, year, month)).total;
}
