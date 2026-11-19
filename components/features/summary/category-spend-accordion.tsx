"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, cn } from "@/lib/utils";
import type { CategorySpendRow, CategoryMonthlySpend } from "@/lib/summary";
import { fetchCategoryMonthlySpend } from "@/app/actions/summary";
import { ChangeIndicator } from "@/components/shared/change-indicator";
import { Accordion } from "@/components/ui/accordion/Accordion";
import { ROW_GRID } from "./spend-row-grid";
import { TotalsRow } from "./totals-row";
import { MonthlyTable } from "./monthly-table";
import { MonthlySkeleton } from "./monthly-skeleton";

export function CategorySpendAccordion({
  spend,
  year,
  mode,
  maxSpend,
  totals,
}: {
  spend: CategorySpendRow[];
  year: number;
  mode: "money" | "percent";
  maxSpend: number;
  totals: { current: number; previous: number };
}) {
  const { t } = useI18n();
  const cache = React.useRef(new Map<string, CategoryMonthlySpend>());
  const inflight = React.useRef(new Set<string>());
  const [loaded, setLoaded] = React.useState<Record<string, CategoryMonthlySpend>>({});
  const [failed, setFailed] = React.useState<Record<string, boolean>>({});

  function load(categoryId: string) {
    const key = `${categoryId}:${year}`;
    if (cache.current.has(key) || inflight.current.has(key)) return;
    inflight.current.add(key);
    setFailed((f) => ({ ...f, [key]: false }));
    fetchCategoryMonthlySpend(categoryId, year)
      .then((data) => {
        cache.current.set(key, data);
        setLoaded((m) => ({ ...m, [key]: data }));
      })
      .catch(() => {
        setFailed((f) => ({ ...f, [key]: true }));
      })
      .finally(() => {
        inflight.current.delete(key);
      });
  }

  return (
    <>
    <div className="max-h-[min(550px,100dvh)] min-h-0 flex-1 overflow-y-auto">
      <div
        className={cn(
          ROW_GRID,
          "sticky top-0 z-10 bg-surface shadow-divider",
          "h-11 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        )}
      >
        <span>{t.common.category}</span>
        <span className="hidden text-end sm:block">{year}</span>
        <span className="hidden text-end sm:block">{year - 1}</span>
        <span className="hidden text-end sm:block">{t.summary.change}</span>
        <span />
      </div>

      <Accordion
        type="multiple"
        onValueChange={(open) => open.forEach(load)}
        items={spend.map((r) => {
          const key = `${r.categoryId}:${year}`;
          const monthly = loaded[key];
          return {
            value: r.categoryId,
            triggerClassName: cn(ROW_GRID, "px-4 py-3"),
            trigger: (
              <>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{r.name}</span>
                  <div className="h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full bg-expense"
                      style={{ width: `${(r.current / maxSpend) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="col-span-2 row-start-2 flex items-center justify-between gap-2 sm:contents">
                  <span className="flex flex-col sm:block sm:text-end">
                    <span className="text-xs text-muted-foreground sm:hidden">
                      {year}
                    </span>
                    <span className="tnum font-medium">
                      {formatMoney(r.current)}
                    </span>
                  </span>
                  <span className="flex flex-col sm:block sm:text-end">
                    <span className="text-xs text-muted-foreground sm:hidden">
                      {year - 1}
                    </span>
                    <span className="tnum text-muted-foreground">
                      {formatMoney(r.previous)}
                    </span>
                  </span>
                  <span className="flex flex-col sm:block sm:text-end">
                    <span className="text-xs text-muted-foreground sm:hidden">
                      {t.summary.change}
                    </span>
                    <ChangeIndicator
                      amount={r.change}
                      pct={r.changePct}
                      mode={mode}
                      invert
                    />
                  </span>
                </div>
              </>
            ),
            contentClassName:
              "overflow-x-auto border-t border-border bg-surface-muted/30 py-2",
            content: monthly ? (
              <MonthlyTable year={year} row={r} monthly={monthly} />
            ) : failed[key] ? (
              <div className="px-3 py-4 text-sm text-muted-foreground">
                {t.common.noData}
              </div>
            ) : (
              <MonthlySkeleton />
            ),
          };
        })}
      />
    </div>
    <TotalsRow totals={totals} year={year} mode={mode} />
    </>
  );
}
