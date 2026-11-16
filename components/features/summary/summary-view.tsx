"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, formatPercent, yoyPercent } from "@/lib/utils";
import type { CategorySpendRow, MonthlyCategorySpend } from "@/lib/summary";
import { PageHeader } from "@/components/shared/page-header";
import { YearSelect } from "@/components/shared/year-select";
import { StatCard, ChangeIndicator } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartCard } from "@/components/shared/charts/chart-card";
import { SharePieChart } from "@/components/shared/charts/share-pie-chart";
import { MonthlyTotalsBarChart } from "@/components/shared/charts/monthly-totals-bar-chart";
import { CategoryMonthlyLineChart } from "@/components/shared/charts/category-monthly-line-chart";
import { CategorySpendAccordion } from "./category-spend-accordion";

export function SummaryView({
  year,
  years,
  spend,
  monthly,
  totals,
  investments,
  goals,
}: {
  year: number;
  years: number[];
  spend: CategorySpendRow[];
  monthly: MonthlyCategorySpend;
  totals: { current: number; previous: number };
  investments: { value: number; prev: number };
  goals: { reached: number; total: number };
}) {
  const { t } = useI18n();
  const [mode, setMode] = React.useState<"money" | "percent">("money");

  const expChange = totals.current - totals.previous;
  const expPct = yoyPercent(totals.current, totals.previous);
  const invChange = investments.value - investments.prev;
  const invPct = yoyPercent(investments.value, investments.prev);
  const maxSpend = Math.max(...spend.map((r) => r.current), 1);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.summary.title} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={`${t.summary.totalExpenses} · ${year}`}
          value={formatMoney(totals.current)}
          accent="expense"
          sub={
            <span className="flex items-center gap-1 text-muted-foreground">
              {t.summary.vsPrevYear}:{" "}
              <ChangeIndicator amount={expChange} pct={expPct} mode="percent" invert />
            </span>
          }
        />
        <StatCard
          label={t.summary.goalsReached}
          value={`${goals.reached} / ${goals.total}`}
          accent="primary"
          sub={
            <span className="text-muted-foreground">
              {goals.total > 0
                ? formatPercent(goals.reached / goals.total)
                : "—"}
            </span>
          }
        />
        <StatCard
          label={t.summary.totalInvestments}
          value={formatMoney(investments.value)}
          accent="investment"
          sub={
            <span className="flex items-center gap-1 text-muted-foreground">
              {t.summary.vsPrevYear}:{" "}
              <ChangeIndicator amount={invChange} pct={invPct} mode="percent" />
            </span>
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.summary.spendByCategory}</h2>
        <div className="flex items-center gap-2">
          <YearSelect year={year} years={years} />
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList>
              <TabsTrigger value="money">{t.summary.shekel}</TabsTrigger>
              <TabsTrigger value="percent">{t.summary.percent}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {spend.length === 0 ? (
        <EmptyState title={t.common.noData} />
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            <ChartCard title={t.summary.chartSpendPie}>
              <SharePieChart
                data={spend
                  .filter((r) => r.current > 0)
                  .map((r) => ({ name: r.name, value: r.current, color: r.color }))}
              />
            </ChartCard>
            <ChartCard title={t.summary.chartMonthlyTotals}>
              <MonthlyTotalsBarChart
                year={year}
                totalsCurrent={monthly.totalsCurrent}
                totalsPrevious={monthly.totalsPrevious}
              />
            </ChartCard>
            {monthly.categories.length > 0 && (
              <ChartCard
                title={t.summary.chartMonthlyByCategory}
                className="lg:col-span-2"
              >
                <CategoryMonthlyLineChart monthly={monthly} />
              </ChartCard>
            )}
          </div>

          <Card className="flex flex-col overflow-hidden">
            <CategorySpendAccordion
              spend={spend}
              year={year}
              mode={mode}
              maxSpend={maxSpend}
              totals={totals}
            />
          </Card>
        </>
      )}
    </div>
  );
}
