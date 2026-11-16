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
}: {
  portfolios: PortfolioSummary[];
  yearlyTotals: YearlyInvestmentTotal[];
}) {
  const { t } = useI18n();

  const byChannel = new Map<string, number>();
  for (const p of portfolios) {
    for (const h of p.holdings) {
      if (h.value === 0) continue;
      const channel = h.channel || "—";
      byChannel.set(channel, (byChannel.get(channel) ?? 0) + h.value);
    }
  }
  const channelData = [...byChannel.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const portfolioData = portfolios
    .filter((p) => p.value > 0)
    .map((p) => ({ name: p.name, value: p.value }));

  if (channelData.length === 0 && yearlyTotals.length === 0) return null;

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
      {yearlyTotals.length > 1 && (
        <ChartCard title={t.investments.chartGrowth} className="lg:col-span-2">
          <InvestmentGrowthLineChart totals={yearlyTotals} />
        </ChartCard>
      )}
    </div>
  );
}
