import { requireUser } from "@/lib/session";
import { fetchIncomeData } from "@/lib/income";
import { getMonthlyCategorySpend } from "@/lib/summary";
import { resolveMonth, resolveYearLoose } from "@/lib/years";
import { IncomeView } from "@/components/features/income/income-view";
import { View } from "@/components/features/income/types";

export default async function IncomePage(props: {
  searchParams: Promise<{ year?: string; month?: string; view?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { householdId } = await requireUser();

  const year = resolveYearLoose(searchParams.year);

  const [{ sources, entries }, monthlySpend] = await Promise.all([
    fetchIncomeData(householdId),
    getMonthlyCategorySpend(year, householdId),
  ]);

  const monthsWithIncome = [
    ...new Set(
      entries.filter((entry) => entry.year === year).map((entry) => entry.month),
    ),
  ];
  const month = resolveMonth(monthsWithIncome, year, searchParams.month);
  const view = searchParams.view === View.Year ? View.Year : View.Month;

  return (
    <IncomeView
      year={year}
      month={month}
      view={view}
      sources={sources}
      entries={entries}
      expenseTotals={monthlySpend.totalsCurrent}
    />
  );
}
