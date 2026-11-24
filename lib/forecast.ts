import { prisma } from "@/lib/db";
import { getExpectedMonthlyIncome } from "@/lib/income";

export const BASELINE_WINDOW_MONTHS = 6;
export const VERDICT_FITS_MAX = 0.85;
export const VERDICT_TIGHT_MAX = 1.0;

export const PlannedItemTypes = {
  OneTime: "ONE_TIME",
  Recurring: "RECURRING",
  Installments: "INSTALLMENTS",
} as const;
export type PlannedItemType =
  (typeof PlannedItemTypes)[keyof typeof PlannedItemTypes];

export const PlannedItemStatuses = {
  Active: "ACTIVE",
  Done: "DONE",
  Cancelled: "CANCELLED",
} as const;
export type PlannedItemStatus =
  (typeof PlannedItemStatuses)[keyof typeof PlannedItemStatuses];

export type RangeMonths = 6 | 12 | 24;

export type MonthKey = { year: number; month: number };

export type Verdict = "fits" | "tight" | "over" | "unknown";

export type BudgetImpactMonth = {
  year: number;
  month: number;
  budget: number;
  baseline: number;
  planned: number;
  projected: number;
};

export type PlannedItemSpec = {
  type: PlannedItemType;
  amount: number;
  installments: number | null;
  startYear: number;
  startMonth: number;
  endYear: number | null;
  endMonth: number | null;
};

export type ForecastItem = PlannedItemSpec & {
  id: string;
  title: string;
  status: PlannedItemStatus;
  note: string | null;
  categoryId: string | null;
  categoryName: string | null;
  impact: number[];
  verdict: Verdict;
  budgetImpact: BudgetImpactMonth[] | null;
};

export type ForecastData = {
  months: MonthKey[];
  baselineTotal: number[];
  baselineByCategory: Record<string, number>;
  baselineMonthsUsed: number;
  income: number[];
  totalBudgetByYear: Record<number, number>;
  items: ForecastItem[];
};

function toMonthIndex(key: MonthKey): number {
  return key.year * 12 + (key.month - 1);
}

export function buildMonthRange(from: MonthKey, length: number): MonthKey[] {
  const start = toMonthIndex(from);
  return Array.from({ length }, (_, offset) => {
    const index = start + offset;
    return { year: Math.floor(index / 12), month: (index % 12) + 1 };
  });
}

export function expandItemImpact(
  item: PlannedItemSpec,
  months: MonthKey[],
): number[] {
  const start = item.startYear * 12 + (item.startMonth - 1);
  return months.map((month) => {
    const index = toMonthIndex(month);
    switch (item.type) {
      case PlannedItemTypes.OneTime:
        return index === start ? item.amount : 0;
      case PlannedItemTypes.Recurring: {
        if (index < start) return 0;
        if (item.endYear != null && item.endMonth != null) {
          const end = item.endYear * 12 + (item.endMonth - 1);
          if (index > end) return 0;
        }
        return item.amount;
      }
      case PlannedItemTypes.Installments: {
        const count = item.installments ?? 1;
        const offset = index - start;
        if (offset < 0 || offset >= count) return 0;
        const perPayment = Math.round((item.amount / count) * 100) / 100;
        if (offset === count - 1)
          return (
            Math.round((item.amount - perPayment * (count - 1)) * 100) / 100
          );
        return perPayment;
      }
    }
  });
}

function completedWindowMonths(current: MonthKey): MonthKey[] {
  const firstWindowMonth = {
    year:
      current.month > BASELINE_WINDOW_MONTHS ? current.year : current.year - 1,
    month: ((current.month - 1 - BASELINE_WINDOW_MONTHS + 12) % 12) + 1,
  };
  return buildMonthRange(firstWindowMonth, BASELINE_WINDOW_MONTHS);
}

type WindowRow = {
  categoryId: string;
  year: number;
  month: number;
  _sum: { amount: unknown };
};

function computeBaseline(
  windowRows: WindowRow[],
  expenseCategoryIds: Set<string>,
): {
  baselineByCategory: Record<string, number>;
  baselineAvg: number;
  baselineMonthsUsed: number;
} {
  const sumByCategory = new Map<string, number>();
  const monthsWithData = new Set<string>();
  for (const row of windowRows) {
    if (!expenseCategoryIds.has(row.categoryId)) continue;
    const amount = Number(row._sum.amount ?? 0);
    sumByCategory.set(
      row.categoryId,
      (sumByCategory.get(row.categoryId) ?? 0) + amount,
    );
    monthsWithData.add(`${row.year}-${row.month}`);
  }
  const baselineMonthsUsed = monthsWithData.size;
  const baselineByCategory: Record<string, number> = {};
  let baselineAvg = 0;
  if (baselineMonthsUsed > 0) {
    for (const [categoryId, total] of sumByCategory) {
      const average = total / baselineMonthsUsed;
      baselineByCategory[categoryId] = average;
      baselineAvg += average;
    }
  }
  return { baselineByCategory, baselineAvg, baselineMonthsUsed };
}

type BudgetRow = { categoryId: string; year: number; monthlyAmount: unknown };

type BudgetIndex = {
  budgetsByCategoryYear: Map<string, Map<number, number>>;
  totalBudgetByYear: Record<number, number>;
  budgetedBaselineByYear: Record<number, number>;
};

function indexBudgets(
  budgets: BudgetRow[],
  baselineByCategory: Record<string, number>,
): BudgetIndex {
  const budgetsByCategoryYear = new Map<string, Map<number, number>>();
  const totalBudgetByYear: Record<number, number> = {};
  const budgetedBaselineByYear: Record<number, number> = {};
  for (const budget of budgets) {
    const amount = Number(budget.monthlyAmount);
    let byYear = budgetsByCategoryYear.get(budget.categoryId);
    if (!byYear) {
      byYear = new Map();
      budgetsByCategoryYear.set(budget.categoryId, byYear);
    }
    byYear.set(budget.year, amount);
    totalBudgetByYear[budget.year] =
      (totalBudgetByYear[budget.year] ?? 0) + amount;
    budgetedBaselineByYear[budget.year] =
      (budgetedBaselineByYear[budget.year] ?? 0) +
      (baselineByCategory[budget.categoryId] ?? 0);
  }
  return { budgetsByCategoryYear, totalBudgetByYear, budgetedBaselineByYear };
}

function resolveCategoryVerdict(
  budgetImpact: BudgetImpactMonth[] | null,
): Verdict {
  const budgetedMonths = (budgetImpact ?? []).filter(
    (impactMonth) => impactMonth.budget > 0,
  );
  if (budgetedMonths.length === 0) return "unknown";
  let worstRatio = 0;
  for (const impactMonth of budgetedMonths) {
    const ratio = impactMonth.projected / impactMonth.budget;
    if (ratio > worstRatio) worstRatio = ratio;
  }
  if (worstRatio <= VERDICT_FITS_MAX) return "fits";
  if (worstRatio <= VERDICT_TIGHT_MAX) return "tight";
  return "over";
}

function buildBudgetImpact(
  categoryId: string,
  months: MonthKey[],
  itemImpact: number[],
  baselineByCategory: Record<string, number>,
  budgetsByCategoryYear: Map<string, Map<number, number>>,
): BudgetImpactMonth[] {
  const budgetByYear = budgetsByCategoryYear.get(categoryId);
  const baseline = baselineByCategory[categoryId] ?? 0;
  return months
    .map((month, index) => ({
      year: month.year,
      month: month.month,
      budget: budgetByYear?.get(month.year) ?? 0,
      baseline,
      planned: itemImpact[index],
      projected: baseline + itemImpact[index],
    }))
    .filter((impactMonth) => impactMonth.planned !== 0);
}

export async function getForecast(
  householdId: string,
  rangeMonths: RangeMonths,
): Promise<ForecastData> {
  const now = new Date();
  const currentMonth: MonthKey = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
  const months = buildMonthRange(currentMonth, rangeMonths);
  const rangeYears = [...new Set(months.map((month) => month.year))];
  const windowMonths = completedWindowMonths(currentMonth);

  const [categories, windowRows, budgets, dbItems] = await Promise.all([
    prisma.category.findMany({
      where: { type: "EXPENSE", householdId },
      select: { id: true, name: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId", "year", "month"],
      where: {
        householdId,
        OR: windowMonths.map((month) => ({
          year: month.year,
          month: month.month,
        })),
      },
      _sum: { amount: true },
    }),
    prisma.budget.findMany({
      where: {
        year: { in: rangeYears },
        category: { householdId, type: "EXPENSE" },
      },
      select: { year: true, categoryId: true, monthlyAmount: true },
    }),
    prisma.plannedItem.findMany({
      where: { householdId, status: PlannedItemStatuses.Active },
      orderBy: [{ startYear: "asc" }, { startMonth: "asc" }],
    }),
  ]);

  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const { baselineByCategory, baselineAvg, baselineMonthsUsed } =
    computeBaseline(windowRows, new Set(categoryNames.keys()));
  const baselineTotal = months.map(() => baselineAvg);

  const income = await Promise.all(
    months.map((month) =>
      getExpectedMonthlyIncome(householdId, month.year, month.month),
    ),
  );

  const budgetIndex = indexBudgets(budgets, baselineByCategory);

  const specs = dbItems.map((item) => ({ ...item, amount: Number(item.amount) }));
  const impacts = specs.map((item) => expandItemImpact(item, months));

  const items: ForecastItem[] = specs.map((item, itemIndex) => {
    const impact = impacts[itemIndex];
    const hasExpenseCategory =
      item.categoryId !== null && categoryNames.has(item.categoryId);
    const budgetImpact = hasExpenseCategory
      ? buildBudgetImpact(
          item.categoryId as string,
          months,
          impact,
          baselineByCategory,
          budgetIndex.budgetsByCategoryYear,
        )
      : null;
    return {
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
      amount: item.amount,
      installments: item.installments,
      startYear: item.startYear,
      startMonth: item.startMonth,
      endYear: item.endYear,
      endMonth: item.endMonth,
      note: item.note,
      categoryId: item.categoryId,
      categoryName: item.categoryId
        ? (categoryNames.get(item.categoryId) ?? null)
        : null,
      impact,
      verdict: resolveCategoryVerdict(budgetImpact),
      budgetImpact,
    };
  });

  return {
    months,
    baselineTotal,
    baselineByCategory,
    baselineMonthsUsed,
    income,
    totalBudgetByYear: budgetIndex.totalBudgetByYear,
    items,
  };
}
