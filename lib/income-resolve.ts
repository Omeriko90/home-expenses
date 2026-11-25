import type { IncomeAmountType, IncomeEntryKind } from "@prisma/client";
import type { TaxBreakdown } from "@/lib/tax/types";

/**
 * Pure income resolution (client-safe — no prisma import). A source's amount
 * for month M is its OVERRIDE entry for M if one exists, else its latest FIXED
 * entry at-or-before M. A source counts only between its first FIXED month and
 * its end month (inclusive), if ended. ONE_TIME entries are standalone and
 * simply add to the month they're in.
 */

export type IncomeSourceData = {
  id: string;
  name: string;
  endYear: number | null;
  endMonth: number | null;
  amountType: IncomeAmountType;
  creditPoints: number;
  pensionRate: number | null;
  hishtalmutRate: number | null;
  hishtalmutCapped: boolean;
};

export type IncomeEntryData = {
  id: string;
  kind: IncomeEntryKind;
  name: string | null;
  year: number;
  month: number;
  amount: number;
  grossAmount: number | null;
  taxBreakdown: TaxBreakdown | null;
  linkedSourceId: string | null;
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

export const monthKey = (year: number, month: number) => year * 12 + month;

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
    for (const entry of entries) {
      if (entry.sourceId !== source.id) continue;
      const entryKey = monthKey(entry.year, entry.month);
      if (entry.kind === "OVERRIDE" && entryKey === key) override = entry;
      if (entry.kind === "FIXED" && entryKey <= key) {
        if (!fixed || entryKey > monthKey(fixed.year, fixed.month))
          fixed = entry;
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
    (entry) =>
      entry.kind === "ONE_TIME" && entry.year === year && entry.month === month,
  );

  const total =
    resolved.reduce((sum, source) => sum + source.amount, 0) +
    oneTimes.reduce((sum, entry) => sum + entry.amount, 0);

  return { sources: resolved, oneTimes, total };
}
