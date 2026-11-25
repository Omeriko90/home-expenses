import {
  monthKey,
  resolveMonthIncome,
  type IncomeEntryData,
  type IncomeSourceData,
} from "@/lib/income-resolve";

export type { IncomeEntryData, IncomeSourceData };

export const View = {
  Month: "month",
  Year: "year",
} as const;
export type ViewMode = (typeof View)[keyof typeof View];

export {
  IncomeTypes as IncomeType,
  AmountTypes,
  type IncomeTypeValue,
  type AmountTypeValue,
} from "@/lib/schemas/income";

export function governingEntryFor(
  sources: IncomeSourceData[],
  entries: IncomeEntryData[],
  sourceId: string,
  year: number,
  month: number,
): IncomeEntryData | null {
  const resolved = resolveMonthIncome(sources, entries, year, month);
  const line = resolved.sources.find(
    (resolvedSource) => resolvedSource.sourceId === sourceId,
  );
  if (!line) return null;
  return entries.find((candidate) => candidate.id === line.entryId) ?? null;
}

export function governingAmountInputFor(
  sources: IncomeSourceData[],
  entries: IncomeEntryData[],
  sourceId: string,
  year: number,
  month: number,
): number | null {
  const governing = governingEntryFor(sources, entries, sourceId, year, month);
  if (!governing) return null;
  return governing.grossAmount ?? governing.amount;
}

export type SourceStatus =
  | { kind: "active" }
  | { kind: "ended"; endYear: number; endMonth: number }
  | { kind: "notStarted"; startYear: number; startMonth: number }
  | { kind: "noEntries" };

export function firstFixedOf(
  entries: IncomeEntryData[],
  sourceId: string,
): IncomeEntryData | null {
  let first: IncomeEntryData | null = null;
  for (const e of entries) {
    if (e.sourceId !== sourceId || e.kind !== "FIXED") continue;
    if (!first || monthKey(e.year, e.month) < monthKey(first.year, first.month))
      first = e;
  }
  return first;
}

export function sourceStatusForMonth(
  source: IncomeSourceData,
  entries: IncomeEntryData[],
  year: number,
  month: number,
): SourceStatus {
  const key = monthKey(year, month);
  if (
    source.endYear !== null &&
    source.endMonth !== null &&
    key > monthKey(source.endYear, source.endMonth)
  ) {
    return { kind: "ended", endYear: source.endYear, endMonth: source.endMonth };
  }
  const first = firstFixedOf(entries, source.id);
  if (!first) return { kind: "noEntries" };
  if (monthKey(first.year, first.month) > key)
    return { kind: "notStarted", startYear: first.year, startMonth: first.month };
  return { kind: "active" };
}

export function isWithinLifetime(
  source: IncomeSourceData,
  entries: IncomeEntryData[],
  year: number,
  month: number,
): boolean {
  return sourceStatusForMonth(source, entries, year, month).kind === "active";
}

export function overrideFor(
  entries: IncomeEntryData[],
  sourceId: string,
  year: number,
  month: number,
): IncomeEntryData | null {
  return (
    entries.find(
      (e) =>
        e.sourceId === sourceId &&
        e.kind === "OVERRIDE" &&
        e.year === year &&
        e.month === month,
    ) ?? null
  );
}
