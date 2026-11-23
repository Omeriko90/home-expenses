"use client";

import { useMemo } from "react";
import type { ForecastData, MonthKey } from "./types";

export type PlannedTotals = {
  /** Sum of the included items' impact per range month. */
  planned: number[];
  totalPlanned: number;
  /** The month with the lowest net (income − baseline − planned). */
  worstMonth: MonthKey;
  worstMonthSpend: number;
};

export function usePlannedTotals(
  forecast: ForecastData,
  excludedIds: Set<string>,
): PlannedTotals {
  const { months, baselineTotal, income, items } = forecast;
  return useMemo(() => {
    const planned = months.map((_, monthIndex) =>
      items.reduce(
        (sum, item) =>
          excludedIds.has(item.id) ? sum : sum + item.impact[monthIndex],
        0,
      ),
    );
    const net = (monthIndex: number) =>
      income[monthIndex] - baselineTotal[monthIndex] - planned[monthIndex];
    const worstIndex = planned.reduce(
      (worst, _, monthIndex) => (net(monthIndex) < net(worst) ? monthIndex : worst),
      0,
    );
    return {
      planned,
      totalPlanned: planned.reduce((sum, amount) => sum + amount, 0),
      worstMonth: months[worstIndex],
      worstMonthSpend: baselineTotal[worstIndex] + planned[worstIndex],
    };
  }, [months, baselineTotal, income, items, excludedIds]);
}
