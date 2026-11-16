"use client";

import { useI18n } from "@/lib/i18n/context";
import type { PortfolioSummary, YearlyInvestmentTotal } from "@/lib/summary";
import { ChartCard } from "@/components/shared/charts/chart-card";
import { SharePieChart } from "@/components/shared/charts/share-pie-chart";
import { InvestmentGrowthLineChart } from "@/components/shared/charts/investment-growth-line-chart";

/** Charts for one portfolio group (the active MAIN/KIDS tab). */
export function InvestmentCharts({
  portfolios,
  yearlyTotals,
  instrument,
}: {
  portfolios: PortfolioSummary[];
  yearlyTotals: YearlyInvestmentTotal[];
  /** Restrict all charts to this instrument; null shows everything. */
  instrument: string | null;
}) {
  const { t } = useI18n();

  const byChannel = new Map<string, number>();
  const byPortfolio = new Map<string, number>();
  for (const p of portfolios) {
    for (const h of p.holdings) {
      if (h.value === 0) continue;
      if (instrument && h.instrument !== instrument) continue;
      const channel = h.channel || "—";
      byChannel.set(channel, (byChannel.get(channel) ?? 0) + h.value);
      byPortfolio.set(p.name, (byPortfolio.get(p.name) ?? 0) + h.value);
    }
  }
  const channelData = [...byChannel.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const portfolioData = [...byPortfolio.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const growthByYear = new Map<number, number>();
  for (const r of yearlyTotals) {
    if (instrument && r.instrument !== instrument) continue;
    growthByYear.set(r.year, (growthByYear.get(r.year) ?? 0) + r.total);
  }
  const growthData = [...growthByYear.entries()]
    .map(([year, total]) => ({ year, total }))
    .filter((r) => r.total !== 0)
    .sort((a, b) => a.year - b.year);

  if (channelData.length === 0 && growthData.length === 0) return null;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {channelData.length > 0 && (
        <ChartCard title={t.investments.chartByChannel}>
          <SharePieChart data={channelData} />
        </ChartCard>
      )}
      {portfolioData.length > 1 && (
        <ChartCard title={t.investments.chartByPortfolio}>
          <SharePieChart data={portfolioData} />
        </ChartCard>
      )}
      {growthData.length > 1 && (
        <ChartCard title={t.investments.chartGrowth} className="lg:col-span-2">
          <InvestmentGrowthLineChart totals={growthData} />
        </ChartCard>
      )}
    </div>
  );
}
