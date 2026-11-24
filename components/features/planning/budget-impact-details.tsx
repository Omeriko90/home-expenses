"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { MonthImpactRow } from "./month-impact-row";
import { formatMonthKey, type ForecastItem } from "./types";

export function BudgetImpactDetails({ item }: { item: ForecastItem }) {
  const { t } = useI18n();
  const [showAll, setShowAll] = useState(false);

  const months = item.budgetImpact ?? [];
  const overMonths = months.filter(
    (impactMonth) =>
      impactMonth.budget > 0 && impactMonth.projected > impactMonth.budget,
  );
  const budgetedMonths = months.filter((impactMonth) => impactMonth.budget > 0);
  const noBudgetMonths = months.filter((impactMonth) => impactMonth.budget <= 0);

  const noBudgetRange =
    noBudgetMonths.length > 0
      ? `${formatMonthKey(noBudgetMonths[0].year, noBudgetMonths[0].month)}–${formatMonthKey(
          noBudgetMonths[noBudgetMonths.length - 1].year,
          noBudgetMonths[noBudgetMonths.length - 1].month,
        )}`
      : "";
  const noBudgetLabel =
    noBudgetMonths.length === 1
      ? t.planning.noBudgetForMonth.replace(
          "{range}",
          formatMonthKey(noBudgetMonths[0].year, noBudgetMonths[0].month),
        )
      : t.planning.noBudgetForMonths
          .replace("{n}", String(noBudgetMonths.length))
          .replace("{range}", noBudgetRange);

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface-muted/40 p-3">
      <span className="text-xs font-medium text-muted-foreground">
        {t.planning.budgetImpact} · {item.categoryName}
      </span>

      {showAll ? (
        <div className="flex flex-col gap-1.5">
          {months.map((impactMonth) => (
            <MonthImpactRow
              key={`${impactMonth.year}-${impactMonth.month}`}
              impactMonth={impactMonth}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {overMonths.length > 0 ? (
            <>
              <span className="flex items-center gap-1.5 text-xs font-medium text-danger">
                <TriangleAlert className="size-3.5 shrink-0" />
                {overMonths.length === 1
                  ? t.planning.overInOneMonth
                  : t.planning.overInMonths.replace(
                      "{n}",
                      String(overMonths.length),
                    )}
              </span>
              {overMonths.map((impactMonth) => (
                <MonthImpactRow
                  key={`${impactMonth.year}-${impactMonth.month}`}
                  impactMonth={impactMonth}
                />
              ))}
            </>
          ) : (
            budgetedMonths.length > 0 && (
              <span className="text-xs font-medium text-success">
                {t.planning.withinAllMonths}
              </span>
            )
          )}
          {noBudgetMonths.length > 0 && (
            <span className="text-xs text-muted-foreground">{noBudgetLabel}</span>
          )}
        </div>
      )}

      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={(event) => {
          event.stopPropagation();
          setShowAll((wasShowingAll) => !wasShowingAll);
        }}
        className="h-auto self-start px-0 text-xs"
      >
        {showAll
          ? t.common.showLess
          : t.common.showAll.replace("{n}", String(months.length))}
      </Button>
    </div>
  );
}
