"use client";

import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import { ProgressBar } from "@/components/shared/progress-bar";
import { formatMonthKey, type ForecastItem } from "./types";

export function BudgetImpactDetails({ item }: { item: ForecastItem }) {
  const { t } = useI18n();
  if (!item.budgetImpact || item.budgetImpact.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface-muted/40 p-3">
      <span className="text-xs font-medium text-muted-foreground">
        {t.planning.budgetImpact} · {item.categoryName}
      </span>
      <div className="flex flex-col gap-1.5">
        {item.budgetImpact.map((b) => {
          const over = b.budget > 0 && b.projected > b.budget;
          return (
            <div
              key={`${b.year}-${b.month}`}
              className="flex items-center gap-3 text-sm"
            >
              <span className="w-12 shrink-0 text-xs text-muted-foreground tnum">
                {formatMonthKey(b.year, b.month)}
              </span>
              <ProgressBar
                value={b.projected}
                max={b.budget}
                over={over}
                className="h-2 flex-1"
              />
              <span className="shrink-0 text-xs tnum">
                <span className={over ? "font-medium text-danger" : undefined}>
                  {formatMoney(b.projected)}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  {t.planning.vsBudget}{" "}
                  {b.budget > 0 ? formatMoney(b.budget) : "—"}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
