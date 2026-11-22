import { requireUser } from "@/lib/session";
import { fetchIncomeData } from "@/lib/income";
import { getMonthlyCategorySpend } from "@/lib/summary";
import { getYears, resolveMonth, resolveYear } from "@/lib/years";
import { IncomeView } from "@/components/features/income/income-view";

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const { householdId } = await requireUser();

  const years = await getYears(householdId);
  const year = resolveYear(years, sp.year);

  const [{ sources, entries }, spend] = await Promise.all([
    fetchIncomeData(householdId),
    getMonthlyCategorySpend(year, householdId),
  ]);

  const monthsWithData = [
    ...new Set(
      entries.filter((e) => e.year === year).map((e) => e.month),
    ),
  ];
  const month = resolveMonth(monthsWithData, year, sp.month);
  const view = sp.view === "year" ? ("year" as const) : ("month" as const);

  return (
    <IncomeView
      years={years}
      year={year}
      month={month}
      view={view}
      sources={sources}
      entries={entries}
      expenseTotals={spend.totalsCurrent}
    />
  );
}
