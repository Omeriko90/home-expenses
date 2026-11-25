"use client";

import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import type { TaxBreakdown } from "@/lib/tax/types";
import { TaxBreakdownLines } from "./tax-breakdown-lines";

export function TaxBreakdownDetails({
  breakdown,
}: {
  breakdown: TaxBreakdown;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface-muted/40 p-3">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium">
          {t.income.gross} {formatMoney(breakdown.gross, { decimals: true })}
        </span>
        <span className="font-medium tnum">
          {t.income.net} {formatMoney(breakdown.net, { decimals: true })}
        </span>
      </div>
      <TaxBreakdownLines breakdown={breakdown} />
      <span className="text-xs text-muted-foreground">
        {t.income.taxYearLabel.replace("{year}", String(breakdown.taxYear))}
      </span>
    </div>
  );
}
