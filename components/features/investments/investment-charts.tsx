"use client";

import { useI18n } from "@/lib/i18n/context";
import type { PortfolioSummary, YearlyInvestmentTotal } from "@/lib/summary";
import { groupHoldingsByType } from "@/lib/investments";
import { ChartCard } from "@/components/shared/charts/chart-card";
import { SharePieChart } from "@/components/shared/charts/share-pie-chart";
import { InvestmentGrowthLineChart } from "@/components/shared/charts/investment-growth-line-chart";

export function InvestmentCharts({
  portfolios,
  yearlyTotals,
  group,
  type,
}: {
  portfolios: PortfolioSummary[];
  yearlyTotals: YearlyInvestmentTotal[];
  group: "MAIN" | "KIDS";
  type: string | null;
}) {
  const { t } = useI18n();

  const byChannel = new Map<string, number>();
  const byPortfolio = new Map<string, number>();
  const shownHoldings: PortfolioSummary["holdings"] = [];
  for (const p of portfolios) {
    for (const h of p.holdings) {
      if (h.value === 0) continue;
      if (type && h.type !== type) continue;
      shownHoldings.push(h);
      const channel = h.channel || "—";
      byChannel.set(channel, (byChannel.get(channel) ?? 0) + h.value);
      byPortfolio.set(p.name, (byPortfolio.get(p.name) ?? 0) + h.value);
    }
  }
  const toSlices = (m: Map<string, number>) =>
    [...m.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  const typeData = groupHoldingsByType(shownHoldings).map((g) => ({
    name: g.type || "—",
    value: g.sum,
  }));
  const channelData = toSlices(byChannel);
  const portfolioData = toSlices(byPortfolio);

  const growthByYear = new Map<number, number>();
  for (const r of yearlyTotals) {
    if (r.group !== group) continue;
    if (type && r.type !== type) continue;
    growthByYear.set(r.year, (growthByYear.get(r.year) ?? 0) + r.total);
  }
  const growthData = [...growthByYear.entries()]
    .map(([year, total]) => ({ year, total }))
    .filter((r) => r.total !== 0)
    .sort((a, b) => a.year - b.year);

  if (typeData.length === 0 && growthData.length === 0) return null;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {typeData.length > 0 && (
        <ChartCard title={t.investments.chartByType}>
          <SharePieChart data={typeData} />
        </ChartCard>
      )}
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
