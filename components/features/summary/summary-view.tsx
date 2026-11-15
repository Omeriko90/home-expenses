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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <div className="flex flex-col gap-6">
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
        <Card className="overflow-hidden">
          <Table containerClassName="max-h-[55vh] overflow-y-auto">
            <TableHeader className="sticky top-0 z-10 bg-surface shadow-divider">
              <TableRow>
                <TableHead>{t.common.category}</TableHead>
                <TableHead className="text-end">{year}</TableHead>
                <TableHead className="text-end">{year - 1}</TableHead>
                <TableHead className="w-36 text-end">{t.summary.change}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spend.map((r) => (
                <TableRow key={r.categoryId}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{r.name}</span>
                      <div className="h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-surface-muted">
                        <div
                          className="h-full bg-expense"
                          style={{ width: `${(r.current / maxSpend) * 100}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-end tnum font-medium">
                    {formatMoney(r.current)}
                  </TableCell>
                  <TableCell className="text-end tnum text-muted-foreground">
                    {formatMoney(r.previous)}
                  </TableCell>
                  <TableCell className="text-end">
                    <ChangeIndicator
                      amount={r.change}
                      pct={r.changePct}
                      mode={mode}
                      invert
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-border bg-surface-muted/50 px-4 py-3 text-sm font-semibold tnum">
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
