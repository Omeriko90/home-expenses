"use client";

import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import { ProgressBar } from "@/components/shared/progress-bar";
import { formatMonthKey, type ForecastItem } from "./types";

export function BudgetImpactDetails({ item }: { item: ForecastItem }) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface-muted/40 p-3">
      <span className="text-xs font-medium text-muted-foreground">
        {t.planning.budgetImpact} · {item.categoryName}
      </span>
      <div className="flex flex-col gap-1.5">
        {(item.budgetImpact ?? []).map((impactMonth) => {
          const over =
            impactMonth.budget > 0 && impactMonth.projected > impactMonth.budget;
          return (
            <div
              key={`${impactMonth.year}-${impactMonth.month}`}
              className="flex items-center gap-3 text-sm"
            >
              <span className="w-12 shrink-0 text-xs text-muted-foreground tnum">
                {formatMonthKey(impactMonth.year, impactMonth.month)}
              </span>
              <ProgressBar
                value={impactMonth.projected}
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
                  {`(${impactMonth.budget > 0 ? formatMoney(impactMonth.budget) : "—"})`}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
