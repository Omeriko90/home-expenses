"use client";

import * as React from "react";
import { Copy, Info, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, formatPercent, formatPercentCompact } from "@/lib/utils";
import {
  upsertBudget,
  copyBudgetsFromPreviousYear,
} from "@/app/actions/budgets";
import { PageHeader } from "@/components/shared/page-header";
import { YearSelect } from "@/components/shared/year-select";
import { MoneyInput } from "@/components/shared/money-input";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatCard } from "@/components/shared/stat-card";
import { TotalsFooterRow } from "@/components/shared/totals-footer-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { Table, type TableColumn } from "@/components/ui/table/Table";

type Row = { categoryId: string; name: string; monthly: number; actual: number };

export function BudgetEditor({
  year,
  years,
  rows,
  mode,
  month,
}: {
  year: number;
  years: number[];
  rows: Row[];
  mode: "month" | "average";
  month: number;
}) {
  const { t } = useI18n();
  const [values, setValues] = React.useState<Record<string, number | "">>(() =>
    Object.fromEntries(rows.map((r) => [r.categoryId, r.monthly || ""])),
  );
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setValues(Object.fromEntries(rows.map((r) => [r.categoryId, r.monthly || ""])));
  }, [rows]);

  const totalMonthly = Object.values(values).reduce<number>(
    (sum, v) => sum + (typeof v === "number" ? v : 0),
    0,
  );
  const totalSpent = rows.reduce((sum, r) => sum + r.actual, 0);
  const remaining = totalMonthly - totalSpent;

  const spentLabel =
    mode === "month"
      ? `${t.budgets.spentLabel} · ${t.months[month - 1]}`
      : `${t.budgets.spentLabel} · ${t.summary.monthlyAvg}`;

  function save(categoryId: string, value: number | "") {
    const monthlyAmount = typeof value === "number" ? value : 0;
    startTransition(async () => {
      await upsertBudget({ categoryId, year, monthlyAmount });
    });
  }

  function copyPrev() {
    startTransition(async () => {
      const res = await copyBudgetsFromPreviousYear(year);
      toast.success(`${t.budgets.copyPrev} (${res.copied})`);
    });
  }

  const derive = (r: Row) => {
    const v = values[r.categoryId];
    const budget = typeof v === "number" ? v : 0;
    return {
      v,
      budget,
      yearly: budget * 12,
      over: r.actual > budget,
      hasBar: budget > 0 || r.actual > 0,
    };
  };

  const percentLabel = (r: Row) => {
    const { budget, over } = derive(r);
    return over ? (
      <Tooltip content={t.budgets.overBudget}>
        <span className="inline-flex w-20 shrink-0 items-center gap-0.5 whitespace-nowrap text-xs font-medium text-danger tnum">
          <TriangleAlert className="size-3.5 shrink-0" />
          {budget > 0
            ? formatPercentCompact(r.actual / budget)
            : t.budgets.noBudget}
        </span>
      </Tooltip>
    ) : (
      <span className="inline-block w-20 shrink-0 text-xs text-muted-foreground tnum">
        {budget > 0 ? formatPercentCompact(r.actual / budget) : null}
      </span>
    );
  };

  const columns: TableColumn<Row>[] = [
    {
      header: t.common.category,
      headClassName: "sm:w-48",
      cellClassName: "font-medium",
      cell: (r) => {
        const { budget, over, hasBar } = derive(r);
        return (
          <div className="flex flex-col gap-1.5">
            <Tooltip content={r.name}>
              <span className="block max-w-28 truncate sm:max-w-44">
                {r.name}
              </span>
            </Tooltip>
            {hasBar && (
              <span className="flex items-center gap-2 sm:hidden">
                <ProgressBar
                  value={r.actual}
                  max={budget}
                  over={over}
                  className="h-2.5 max-w-40"
                />
                {percentLabel(r)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: t.budgets.usage,
      headClassName: "hidden pe-8 sm:table-cell",
      cellClassName: "hidden pe-8 sm:table-cell",
      cell: (r) => {
        const { budget, over, hasBar } = derive(r);
        return (
          hasBar && (
            <span className="flex items-center gap-2">
              <ProgressBar
                value={r.actual}
                max={budget}
                over={over}
                className="h-2.5"
              />
              {percentLabel(r)}
            </span>
          )
        );
      },
    },
    {
      header: mode === "month" ? t.budgets.spent : t.summary.monthlyAvg,
      headClassName: "w-20 sm:w-40",
      cellClassName: "tnum",
      cell: (r) =>
        r.actual === 0 ? (
          <span className="text-faint">—</span>
        ) : (
          <span className={derive(r).over ? "text-danger" : undefined}>
            {formatMoney(r.actual)}
          </span>
        ),
    },
    {
      header: t.budgets.monthlyBudget,
      headClassName: "w-40",
      cell: (r) => {
        const { v } = derive(r);
        return (
          <MoneyInput
            value={v ?? ""}
            onValueChange={(val) =>
              setValues((prev) => ({ ...prev, [r.categoryId]: val }))
            }
            onBlur={() => save(r.categoryId, v ?? "")}
          />
        );
      },
    },
    {
      header: (
        <span className="inline-flex items-center gap-1">
          {t.budgets.yearlyBudget}
          <Tooltip content={t.budgets.subtitle}>
            <button
              type="button"
              aria-label={t.budgets.subtitle}
              className="text-muted-foreground hover:text-foreground"
            >
              <Info className="size-3.5" />
            </button>
          </Tooltip>
        </span>
      ),
      headClassName: "hidden w-40 text-end sm:table-cell",
      cellClassName: "hidden text-end tnum text-muted-foreground sm:table-cell",
      cell: (r) => formatMoney(derive(r).yearly),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button
              variant="outline"
              className="bg-surface"
              onClick={copyPrev}
              disabled={pending}
            >
              <Copy /> {t.budgets.copyPrev}
            </Button>
            <YearSelect
              year={year}
              years={years}
              className="flex-1 sm:flex-none"
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t.budgets.totalBudget}
          value={formatMoney(totalMonthly)}
          accent="primary"
          sub={
            <span className="text-muted-foreground tnum">
              {t.budgets.totalYearly}: {formatMoney(totalMonthly * 12)}
            </span>
          }
        />
        <StatCard
          label={
            mode === "average" ? (
              <span className="inline-flex items-center gap-1">
                {spentLabel}
                <Tooltip content={t.budgets.avgHint}>
                  <button
                    type="button"
                    aria-label={t.budgets.avgHint}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Info className="size-3.5" />
                  </button>
                </Tooltip>
              </span>
            ) : (
              spentLabel
            )
          }
          value={formatMoney(totalSpent)}
          accent="expense"
        />
        <StatCard
          label={t.budgets.remaining}
          value={formatMoney(remaining)}
          accent="income"
          sub={
            remaining < 0 ? (
              <span className="inline-flex items-center gap-1 font-medium text-danger">
                <TriangleAlert className="size-4" />
                {t.budgets.overBudget}
              </span>
            ) : (
              <span className="text-muted-foreground tnum">
                {totalMonthly > 0
                  ? `${formatPercent(totalSpent / totalMonthly)} ${t.budgets.ofBudget}`
                  : "—"}
              </span>
            )
          }
        />
      </div>

      <Card className="overflow-hidden">
        <Table columns={columns} data={rows} rowKey={(r) => r.categoryId} />
        <TotalsFooterRow>
          <span>{t.common.total}</span>
          <div className="flex gap-8 tnum">
            <span>
              {t.budgets.spentLabel}: {formatMoney(totalSpent)}
            </span>
            <span>
              {t.budgets.monthlyShort}: {formatMoney(totalMonthly)}
            </span>
            <span className="hidden sm:inline">
              {t.budgets.yearlyShort}: {formatMoney(totalMonthly * 12)}
            </span>
          </div>
        </TotalsFooterRow>
      </Card>
    </div>
  );
}
