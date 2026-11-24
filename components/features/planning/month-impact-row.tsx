"use client";

import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import { ProgressBar } from "@/components/shared/progress-bar";
import { formatMonthKey, type BudgetImpactMonth } from "./types";

export function MonthImpactRow({ impactMonth }: { impactMonth: BudgetImpactMonth }) {
  const { t } = useI18n();
  const hasBudget = impactMonth.budget > 0;
  const over = hasBudget && impactMonth.projected > impactMonth.budget;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-12 shrink-0 text-xs text-muted-foreground tnum">
        {formatMonthKey(impactMonth.year, impactMonth.month)}
      </span>
      <ProgressBar
        value={hasBudget ? impactMonth.projected : 0}
        max={impactMonth.budget}
        over={over}
        className="h-2 flex-1"
      />
      <span className="shrink-0 text-xs tnum">
        <span className={over ? "font-medium text-danger" : undefined}>
          {formatMoney(impactMonth.projected)}
        </span>
        <span className="text-muted-foreground">
          {" "}
          {t.planning.vsBudget}{" "}
          <span dir="ltr" className="inline-block">
            {`(${
              hasBudget
                ? formatMoney(impactMonth.budget).replace(/[‎‏]/g, "")
                : "—"
            })`}
          </span>
        </span>
      </span>
    </div>
  );
}
