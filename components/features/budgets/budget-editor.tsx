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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Row = { categoryId: string; name: string; monthly: number; actual: number };

/** Truncated category name; shows the full text in a tooltip only when ellipsed. */
function CategoryName({ name }: { name: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setTruncated(el.scrollWidth > el.clientWidth);
    measure();
    // overflow can appear once webfonts swap in without the span's box resizing
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [name]);
  // Always keep the Tooltip trigger mounted: swapping the wrapper in and out
  // remounts the span, which detaches the ResizeObserver mid-measure.
  return (
    <Tooltip content={name} disabled={!truncated}>
      <span ref={ref} className="block max-w-28 truncate sm:max-w-44">
        {name}
      </span>
    </Tooltip>
  );
}

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
  /** "month": actuals are the current month's spend. "average": yearly total / 12. */
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
  // Totals come from the visible (non-archived) rows so budget/spent/remaining
  // stay mutually consistent even when archived categories have history.
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="bg-surface"
              onClick={copyPrev}
              disabled={pending}
            >
              <Copy /> {t.budgets.copyPrev}
            </Button>
            <YearSelect year={year} years={years} />
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sm:w-[200px]">{t.common.category}</TableHead>
              <TableHead className="hidden pe-8 sm:table-cell">
                {t.budgets.usage}
              </TableHead>
              <TableHead className="w-20 sm:w-40">
                {mode === "month" ? t.budgets.spent : t.summary.monthlyAvg}
              </TableHead>
              <TableHead className="w-40">{t.budgets.monthlyBudget}</TableHead>
              <TableHead className="hidden w-40 text-end sm:table-cell">
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
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const v = values[r.categoryId];
              const budget = typeof v === "number" ? v : 0;
              const yearly = budget * 12;
              const over = r.actual > budget;
              const hasBar = budget > 0 || r.actual > 0;
              const percentLabel = over ? (
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
              return (
                <TableRow key={r.categoryId}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1.5">
                      <CategoryName name={r.name} />
                      {hasBar && (
                        <span className="flex items-center gap-2 sm:hidden">
                          <ProgressBar
                            value={r.actual}
                            max={budget}
                            over={over}
                            className="h-2.5 max-w-40"
                          />
                          {percentLabel}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden pe-8 sm:table-cell">
                    {hasBar && (
                      <span className="flex items-center gap-2">
                        <ProgressBar
                          value={r.actual}
                          max={budget}
                          over={over}
                          className="h-2.5"
                        />
                        {percentLabel}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="tnum">
                    {r.actual === 0 ? (
                      <span className="text-faint">—</span>
                    ) : (
                      <span className={over ? "text-danger" : undefined}>
                        {formatMoney(r.actual)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <MoneyInput
                      value={v ?? ""}
                      onValueChange={(val) =>
                        setValues((prev) => ({ ...prev, [r.categoryId]: val }))
                      }
                      onBlur={() => save(r.categoryId, v ?? "")}
                    />
                  </TableCell>
                  <TableCell className="hidden text-end tnum text-muted-foreground sm:table-cell">
                    {formatMoney(yearly)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t border-border bg-surface-muted/50 px-4 py-3 text-sm font-semibold">
          <span>{t.common.total}</span>
          <div className="flex gap-8 tnum">
            <span>
              {t.budgets.totalSpent}: {formatMoney(totalSpent)}
            </span>
            <span>
              {t.budgets.totalMonthly}: {formatMoney(totalMonthly)}
            </span>
            <span className="hidden sm:inline">
              {t.budgets.totalYearly}: {formatMoney(totalMonthly * 12)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
