import { getYears, resolveYear } from "@/lib/years";
import {
  getCategorySpend,
  getMonthlyCategorySpend,
  getPortfolioSummaries,
  getGoalStats,
} from "@/lib/summary";
import { requireUser } from "@/lib/session";
import { SummaryView } from "@/components/features/summary/summary-view";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const { householdId } = await requireUser();
  const years = await getYears(householdId);
  const year = resolveYear(years, sp.year);

  const [spend, monthly, portfolios, goalStats] = await Promise.all([
    getCategorySpend(year, householdId),
    getMonthlyCategorySpend(year, householdId),
    getPortfolioSummaries(year, householdId),
    getGoalStats(year, householdId),
  ]);

  const totalCurrent = spend.reduce((s, r) => s + r.current, 0);
  const totalPrevious = spend.reduce((s, r) => s + r.previous, 0);

  const invValue = portfolios.reduce((s, p) => s + p.value, 0);
  const invPrev = portfolios.reduce((s, p) => s + p.prevValue, 0);

  return (
    <SummaryView
      year={year}
      years={years}
      spend={spend}
      monthly={monthly}
      totals={{ current: totalCurrent, previous: totalPrevious }}
      investments={{ value: invValue, prev: invPrev }}
      goals={goalStats}
    />
  );
}
