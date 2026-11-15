import { getYears, resolveYear } from "@/lib/years";
import {
  getCategorySpend,
  getPortfolioSummaries,
  getGoalStats,
} from "@/lib/summary";
import { SummaryView } from "@/components/features/summary/summary-view";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const years = await getYears();
  const year = resolveYear(years, sp.year);

  const [spend, portfolios, goalStats] = await Promise.all([
    getCategorySpend(year),
    getPortfolioSummaries(year),
    getGoalStats(year),
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
      totals={{ current: totalCurrent, previous: totalPrevious }}
      investments={{ value: invValue, prev: invPrev }}
      goals={goalStats}
    />
  );
}
