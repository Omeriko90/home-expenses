"use client";

import { useI18n } from "@/lib/i18n/context";
import { formatMoney, cn, yoyPercent } from "@/lib/utils";
import { ChangeIndicator } from "@/components/shared/change-indicator";
import { TotalsFooterRow } from "@/components/shared/totals-footer-row";
import { ROW_GRID } from "./spend-row-grid";

export function TotalsRow({
  totals,
  year,
  mode,
}: {
  totals: { current: number; previous: number };
  year: number;
  mode: "money" | "percent";
}) {
  const { t } = useI18n();
  const change = totals.current - totals.previous;
  const pct = yoyPercent(totals.current, totals.previous);
  return (
    <TotalsFooterRow className={cn(ROW_GRID)}>
      <span>{t.common.total}</span>
      <div className="col-span-2 row-start-2 flex items-center justify-between gap-2 sm:contents">
        <span className="flex flex-col sm:block sm:text-end">
          <span className="text-xs font-normal text-muted-foreground sm:hidden">
            {year}
          </span>
          <span className="tnum">{formatMoney(totals.current)}</span>
        </span>
        <span className="flex flex-col sm:block sm:text-end">
          <span className="text-xs font-normal text-muted-foreground sm:hidden">
            {year - 1}
          </span>
          <span className="tnum text-muted-foreground">
            {formatMoney(totals.previous)}
          </span>
        </span>
        <span className="flex flex-col sm:block sm:text-end">
          <span className="text-xs font-normal text-muted-foreground sm:hidden">
            {t.summary.change}
          </span>
          <ChangeIndicator amount={change} pct={pct} mode={mode} invert />
        </span>
      </div>
      <span className="hidden sm:block" />
    </TotalsFooterRow>
  );
}
