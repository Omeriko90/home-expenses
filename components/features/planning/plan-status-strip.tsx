"use client";

import { CircleCheck, TriangleAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { formatMonthKey, type MonthKey } from "./types";

const MAX_LISTED_MONTHS = 4;

function monthsLabel(months: MonthKey[]): string {
  if (months.length === 0 || months.length > MAX_LISTED_MONTHS) return "";
  return months
    .map((month) => formatMonthKey(month.year, month.month))
    .join(", ");
}

export function PlanStatusStrip({
  months,
  baselineTotal,
  planned,
  income,
  totalBudgetByYear,
}: {
  months: MonthKey[];
  baselineTotal: number[];
  planned: number[];
  income: number[];
  totalBudgetByYear: Record<number, number>;
}) {
  const { t } = useI18n();

  const overIncomeMonths: MonthKey[] = [];
  const overBudgetMonths: MonthKey[] = [];
  let hasComparison = false;

  months.forEach((month, index) => {
    const projectedTotal = baselineTotal[index] + planned[index];
    const monthIncome = income[index];
    const yearBudget = totalBudgetByYear[month.year];
    if (monthIncome > 0) {
      hasComparison = true;
      if (projectedTotal > monthIncome) overIncomeMonths.push(month);
    }
    if (yearBudget !== undefined && yearBudget > 0) {
      hasComparison = true;
      if (projectedTotal > yearBudget) overBudgetMonths.push(month);
    }
  });

  if (!hasComparison) return null;

  const severity =
    overIncomeMonths.length > 0
      ? "danger"
      : overBudgetMonths.length > 0
        ? "warning"
        : "success";

  const fill = (template: string, list: MonthKey[]) => {
    const label = monthsLabel(list);
    return template
      .replace("{n}", String(list.length))
      .replace("{months}", list.length === 1 ? label : label ? ` (${label})` : "");
  };

  const message =
    severity === "success"
      ? t.planning.planStatusOk
      : severity === "warning"
        ? fill(
            overBudgetMonths.length === 1
              ? t.planning.planStatusOverBudgetOne
              : t.planning.planStatusOverBudget,
            overBudgetMonths,
          )
        : [
            fill(
              overIncomeMonths.length === 1
                ? t.planning.planStatusOverIncomeOne
                : t.planning.planStatusOverIncome,
              overIncomeMonths,
            ),
            overBudgetMonths.length > 0
              ? t.planning.planStatusAlsoOverBudget.replace(
                  "{n}",
                  String(overBudgetMonths.length),
                )
              : "",
          ]
            .filter(Boolean)
            .join(" ");

  return (
    <p
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
        severity === "success" &&
          "border-success-border bg-success-subtle text-success",
        severity === "warning" &&
          "border-warning-border bg-warning-subtle text-warning",
        severity === "danger" &&
          "border-danger-border bg-danger-subtle text-danger",
      )}
    >
      {severity === "success" ? (
        <CircleCheck className="size-4 shrink-0" />
      ) : (
        <TriangleAlert className="size-4 shrink-0" />
      )}
      {message}
    </p>
  );
}
