import type {
  ForecastData,
  ForecastItem,
  HorizonMonths,
  MonthKey,
  Verdict,
} from "@/lib/forecast";

export type { ForecastData, ForecastItem, HorizonMonths, MonthKey, Verdict };

export type PlannedItemType = "ONE_TIME" | "RECURRING" | "INSTALLMENTS";
export type PlannedItemStatus = "ACTIVE" | "DONE" | "CANCELLED";

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
