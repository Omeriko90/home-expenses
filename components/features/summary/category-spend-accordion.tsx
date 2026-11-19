"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, cn } from "@/lib/utils";
import type { CategorySpendRow, CategoryMonthlySpend } from "@/lib/summary";
import { fetchCategoryMonthlySpend } from "@/app/actions/summary";
import { ChangeIndicator } from "@/components/shared/stat-card";
import { ROW_GRID } from "./spend-row-grid";
import { TotalsRow } from "./totals-row";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


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
  // Fetched monthly data, keyed by `${categoryId}:${year}` — survives
  // collapse/expand so the same category is never fetched twice.
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
        // Not cached — re-expanding retries.
        setFailed((f) => ({ ...f, [key]: true }));
      })
      .finally(() => {
        inflight.current.delete(key);
      });
  }

  return (
    <>
    {/* The dashboard scrolls (cards + charts above), so the category list
        caps at 550px and scrolls internally; the totals row stays below. */}
    <div className="max-h-[min(550px,100dvh)] min-h-0 flex-1 overflow-y-auto">
      <div
        className={cn(
          ROW_GRID,
          "sticky top-0 z-10 bg-surface shadow-divider",
          // Match TableHead typography.
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
        onValueChange={(open: string[]) => open.forEach(load)}
      >
        {spend.map((r) => {
          const key = `${r.categoryId}:${year}`;
          const monthly = loaded[key];
          return (
            <AccordionItem key={r.categoryId} value={r.categoryId}>
              <AccordionTrigger className={cn(ROW_GRID, "px-4 py-3")}>
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
              </AccordionTrigger>
              <AccordionContent className="overflow-x-auto border-t border-border bg-surface-muted/30 py-2">
                {monthly ? (
                  <MonthlyTable year={year} row={r} monthly={monthly} />
                ) : failed[key] ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">
                    {t.common.noData}
                  </div>
                ) : (
                  <MonthlySkeleton />
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
    <TotalsRow totals={totals} year={year} mode={mode} />
    </>
  );
}

function MonthlyTable({
  year,
  row,
  monthly,
}: {
  year: number;
  row: CategorySpendRow;
  monthly: CategoryMonthlySpend;
}) {
  const { t } = useI18n();
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-9 ps-4" />
          {t.months.map((m) => (
            <TableHead key={m} className="h-9 text-end">
              {m}
            </TableHead>
          ))}
          <TableHead className="h-9 text-end">{t.common.total}</TableHead>
          <TableHead className="h-9 pe-4 text-end">{t.summary.monthlyAvg}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <YearRow year={year} values={monthly.current} total={row.current} />
        <YearRow year={year - 1} values={monthly.previous} total={row.previous} muted />
      </TableBody>
    </Table>
  );
}

function YearRow({
  year,
  values,
  total,
  muted = false,
}: {
  year: number;
  values: number[];
  total: number;
  muted?: boolean;
}) {
  return (
    <TableRow className={cn("hover:bg-transparent", muted && "text-muted-foreground")}>
      <TableCell className="py-2.5 ps-4 font-medium tnum">{year}</TableCell>
      {values.map((v, i) => (
        <TableCell key={i} className="py-2.5 text-end tnum whitespace-nowrap">
          {v === 0 ? <span className="text-faint">—</span> : formatMoney(v)}
        </TableCell>
      ))}
      <TableCell className="py-2.5 text-end tnum font-semibold whitespace-nowrap">
        {formatMoney(total)}
      </TableCell>
      <TableCell className="py-2.5 pe-4 text-end tnum whitespace-nowrap">
        {formatMoney(total / 12)}
      </TableCell>
    </TableRow>
  );
}

function MonthlySkeleton() {
  return (
    <div className="flex flex-col gap-2 px-3 py-4" aria-busy>
      <div className="h-4 w-full animate-pulse rounded bg-surface-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-surface-muted" />
    </div>
  );
}
