import type {
  BudgetImpactMonth,
  ForecastData,
  ForecastItem,
  MonthKey,
  PlannedItemStatus,
  PlannedItemType,
  RangeMonths,
  Verdict,
} from "@/lib/forecast";
import { PlannedItemStatuses, PlannedItemTypes } from "@/lib/forecast";

export type {
  BudgetImpactMonth,
  ForecastData,
  ForecastItem,
  MonthKey,
  PlannedItemStatus,
  PlannedItemType,
  RangeMonths,
  Verdict,
};
export { PlannedItemStatuses, PlannedItemTypes };

export const DURATION_PRESETS = [3, 6, 9, 12];

export type ArchivedItem = {
  id: string;
  title: string;
  type: PlannedItemType;
  status: PlannedItemStatus;
  amount: number;
  installments: number | null;
  startYear: number;
  startMonth: number;
  endYear: number | null;
  endMonth: number | null;
  note: string | null;
  categoryId: string | null;
  categoryName: string | null;
};

export type PlanningCategory = { id: string; name: string };

export function formatMonthKey(year: number, month: number): string {
  return `${String(month).padStart(2, "0")}/${String(year % 100).padStart(2, "0")}`;
}
