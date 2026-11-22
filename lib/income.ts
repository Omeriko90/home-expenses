import { prisma } from "@/lib/db";
import type { IncomeEntryKind } from "@prisma/client";

/**
 * Income resolution. A source's amount for month M is its OVERRIDE entry for M
 * if one exists, else its latest FIXED entry at-or-before M. A source counts
 * only between its first FIXED month and its end month (inclusive), if ended.
 * ONE_TIME entries are standalone and simply add to the month they're in.
 */

export type IncomeSourceData = {
  id: string;
  name: string;
  endYear: number | null;
  endMonth: number | null;
};

export type IncomeEntryData = {
  id: string;
  kind: IncomeEntryKind;
  name: string | null;
  year: number;
  month: number;
  amount: number;
  note: string | null;
  sourceId: string | null;
};

export type ResolvedSourceIncome = {
  sourceId: string;
  name: string;
  amount: number;
  /** Entry the amount came from (the override, or the governing FIXED row). */
  entryId: string;
  /** True when an OVERRIDE entry replaced the fixed amount this month. */
  isOverride: boolean;
  note: string | null;
};

export type ResolvedMonthIncome = {
  /** Active sources that have an amount this month. */
  sources: ResolvedSourceIncome[];
  /** Standalone ONE_TIME entries of this month. */
  oneTimes: IncomeEntryData[];
  total: number;
};

const monthKey = (year: number, month: number) => year * 12 + month;

/** Pure resolution over already-fetched data (unit-tested). */
export function resolveMonthIncome(
  sources: IncomeSourceData[],
  entries: IncomeEntryData[],
  year: number,
  month: number,
): ResolvedMonthIncome {
  const key = monthKey(year, month);
  const resolved: ResolvedSourceIncome[] = [];

  for (const source of sources) {
    if (
      source.endYear !== null &&
      source.endMonth !== null &&
      key > monthKey(source.endYear, source.endMonth)
    ) {
      continue; // ended before this month
    }

    let override: IncomeEntryData | undefined;
    let fixed: IncomeEntryData | undefined;
    for (const e of entries) {
      if (e.sourceId !== source.id) continue;
      const eKey = monthKey(e.year, e.month);
      if (e.kind === "OVERRIDE" && eKey === key) override = e;
      if (e.kind === "FIXED" && eKey <= key) {
        if (!fixed || eKey > monthKey(fixed.year, fixed.month)) fixed = e;
      }
    }

    // An override only applies within the source's lifetime, which starts at
    // the first FIXED entry — a source with no FIXED yet doesn't count.
    const winner = fixed ? (override ?? fixed) : undefined;
    if (!winner) continue;

    resolved.push({
      sourceId: source.id,
      name: source.name,
      amount: winner.amount,
      entryId: winner.id,
      isOverride: winner.kind === "OVERRIDE",
      note: winner.note,
    });
  }

  const oneTimes = entries.filter(
    (e) => e.kind === "ONE_TIME" && e.year === year && e.month === month,
  );

  const total =
    resolved.reduce((sum, s) => sum + s.amount, 0) +
    oneTimes.reduce((sum, e) => sum + e.amount, 0);

  return { sources: resolved, oneTimes, total };
}

async function fetchIncomeData(householdId: string): Promise<{
  sources: IncomeSourceData[];
  entries: IncomeEntryData[];
}> {
  const [sources, entries] = await Promise.all([
    prisma.incomeSource.findMany({
      where: { householdId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, endYear: true, endMonth: true },
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
        note: true,
        sourceId: true,
      },
    }),
  ]);
  return {
    sources,
    entries: entries.map((e) => ({ ...e, amount: Number(e.amount) })),
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
