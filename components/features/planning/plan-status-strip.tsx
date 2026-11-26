"use client";

import { CircleCheck, TriangleAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { formatMonthKey, type MonthKey } from "./types";

const MAX_LISTED_MONTHS = 4;

type Severity = "success" | "warning" | "danger";

function monthsLabel(months: MonthKey[]): string {
  if (months.length === 0 || months.length > MAX_LISTED_MONTHS) return "";
  return months
    .map((month) => formatMonthKey(month.year, month.month))
    .join(", ");
}

function scanPlan(
  months: MonthKey[],
  baselineTotal: number[],
  planned: number[],
  income: number[],
  totalBudgetByYear: Record<number, number>,
) {
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

  return { overIncomeMonths, overBudgetMonths, hasComparison };
}

function buildMessage(
  planning: Dictionary["planning"],
  severity: Severity,
  overIncomeMonths: MonthKey[],
  overBudgetMonths: MonthKey[],
): string {
  const fill = (template: string, list: MonthKey[]) => {
    const label = monthsLabel(list);
    return template
      .replace("{n}", String(list.length))
      .replace("{months}", list.length === 1 ? label : label ? ` (${label})` : "");
  };

  if (severity === "success") return planning.planStatusOk;

  if (severity === "warning") {
    return fill(
      overBudgetMonths.length === 1
        ? planning.planStatusOverBudgetOne
        : planning.planStatusOverBudget,
      overBudgetMonths,
    );
  }

  return [
    fill(
      overIncomeMonths.length === 1
        ? planning.planStatusOverIncomeOne
        : planning.planStatusOverIncome,
      overIncomeMonths,
    ),
    overBudgetMonths.length > 0
      ? planning.planStatusAlsoOverBudget.replace(
          "{n}",
          String(overBudgetMonths.length),
        )
      : "",
  ]
    .filter(Boolean)
    .join(" ");
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

  const { overIncomeMonths, overBudgetMonths, hasComparison } = scanPlan(
    months,
    baselineTotal,
    planned,
    income,
    totalBudgetByYear,
  );

  if (!hasComparison) return null;

  const severity: Severity =
    overIncomeMonths.length > 0
      ? "danger"
      : overBudgetMonths.length > 0
        ? "warning"
        : "success";

  const message = buildMessage(
    t.planning,
    severity,
    overIncomeMonths,
    overBudgetMonths,
  );

  const StatusIcon = severity === "success" ? CircleCheck : TriangleAlert;

  return (
    <p
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm border-success-border bg-success-subtle text-success",
        {
          "border-warning-border bg-warning-subtle text-warning":
            severity === "warning",
          "border-danger-border bg-danger-subtle text-danger":
            severity === "danger",
        },
      )}
    >
      <StatusIcon className="size-4 shrink-0" />
      {message}
    </p>
  );
}
