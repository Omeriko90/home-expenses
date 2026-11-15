"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, formatPercent, yoyPercent, cn } from "@/lib/utils";
import type { CategorySpendRow } from "@/lib/summary";
import { PageHeader } from "@/components/shared/page-header";
import { YearSelect } from "@/components/shared/year-select";
import { StatCard, ChangeIndicator } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategorySpendAccordion } from "./category-spend-accordion";

export function SummaryView({
  year,
  years,
  spend,
  totals,
  investments,
  goals,
}: {
  year: number;
  years: number[];
  spend: CategorySpendRow[];
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
    // Fill <main>'s height: the category list scrolls internally so the
    // totals row at the bottom of the card is always visible.
    <div className="flex h-full min-h-0 flex-col gap-6">
      <PageHeader
        title={t.summary.title}
        actions={<YearSelect year={year} years={years} />}
      />

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
        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <TabsList>
            <TabsTrigger value="money">{t.summary.shekel}</TabsTrigger>
            <TabsTrigger value="percent">{t.summary.percent}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {spend.length === 0 ? (
        <EmptyState title={t.common.noData} />
      ) : (
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CategorySpendAccordion
            spend={spend}
            year={year}
            mode={mode}
            maxSpend={maxSpend}
          />
          <div className="flex shrink-0 items-center justify-between border-t border-border bg-surface-muted/50 px-4 py-3 text-sm font-semibold tnum">
            <span className="font-sans">{t.common.total}</span>
            <div className="flex gap-6">
              <span>{formatMoney(totals.current)}</span>
              <span
                className={cn(
                  expChange > 0 ? "text-danger" : "text-success",
                )}
              >
                {mode === "money"
                  ? formatMoney(expChange, { sign: true })
                  : expPct === null
                    ? "—"
                    : formatPercent(expPct, { sign: true })}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
