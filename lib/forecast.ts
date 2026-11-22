import { prisma } from "@/lib/db";
import { getExpectedMonthlyIncome } from "@/lib/income";

export const BASELINE_WINDOW_MONTHS = 6;
export const VERDICT_FITS_MAX = 0.85;
export const VERDICT_TIGHT_MAX = 1.0;

export type HorizonMonths = 6 | 12 | 24;

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
  type: "ONE_TIME" | "RECURRING" | "INSTALLMENTS";
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
  status: "ACTIVE" | "DONE" | "CANCELLED";
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

function monthIndex(k: MonthKey): number {
  return k.year * 12 + (k.month - 1);
}

export function buildHorizon(from: MonthKey, length: number): MonthKey[] {
  const start = monthIndex(from);
  return Array.from({ length }, (_, i) => {
    const idx = start + i;
    return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
  });
}

/** Monthly cost series of one planned item across the horizon months. */
export function expandItemImpact(
  item: PlannedItemSpec,
  months: MonthKey[],
): number[] {
  const start = item.startYear * 12 + (item.startMonth - 1);
  return months.map((m) => {
    const idx = monthIndex(m);
    switch (item.type) {
      case "ONE_TIME":
        return idx === start ? item.amount : 0;
      case "RECURRING": {
        if (idx < start) return 0;
        if (item.endYear != null && item.endMonth != null) {
          const end = item.endYear * 12 + (item.endMonth - 1);
          if (idx > end) return 0;
        }
        return item.amount;
      }
      case "INSTALLMENTS": {
        const n = item.installments ?? 1;
        const offset = idx - start;
        if (offset < 0 || offset >= n) return 0;
        const perPayment = Math.round((item.amount / n) * 100) / 100;
        // Last payment absorbs the rounding remainder so the series sums
        // exactly to the total.
        if (offset === n - 1)
          return Math.round((item.amount - perPayment * (n - 1)) * 100) / 100;
        return perPayment;
      }
    }
  });
}

export async function getForecast(
  householdId: string,
  horizonMonths: HorizonMonths,
): Promise<ForecastData> {
  const now = new Date();
  const current: MonthKey = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
  const months = buildHorizon(current, horizonMonths);
  const horizonYears = [...new Set(months.map((m) => m.year))];
  // Last N completed months — the current partial month would drag the
  // average down.
  const windowMonths = buildHorizon(
    {
      year:
        current.month > BASELINE_WINDOW_MONTHS
          ? current.year
          : current.year - 1,
      month:
        ((current.month - 1 - BASELINE_WINDOW_MONTHS + 12) % 12) + 1,
    },
    BASELINE_WINDOW_MONTHS,
  );

  const [categories, windowRows, budgets, dbItems] = await Promise.all([
    prisma.category.findMany({
      where: { type: "EXPENSE", householdId },
      select: { id: true, name: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId", "year", "month"],
      where: {
        householdId,
        OR: windowMonths.map((m) => ({ year: m.year, month: m.month })),
      },
      _sum: { amount: true },
    }),
    prisma.budget.findMany({
      where: {
        year: { in: horizonYears },
        category: { householdId, type: "EXPENSE" },
      },
      select: { year: true, categoryId: true, monthlyAmount: true },
    }),
    prisma.plannedItem.findMany({
      where: { householdId, status: "ACTIVE" },
      orderBy: [{ startYear: "asc" }, { startMonth: "asc" }],
    }),
  ]);

  const expenseCategories = new Map(categories.map((c) => [c.id, c.name]));

  const sumByCategory = new Map<string, number>();
  const monthsWithData = new Set<string>();
  for (const r of windowRows) {
    if (!expenseCategories.has(r.categoryId)) continue;
    const amount = Number(r._sum.amount ?? 0);
    sumByCategory.set(
      r.categoryId,
      (sumByCategory.get(r.categoryId) ?? 0) + amount,
    );
    monthsWithData.add(`${r.year}-${r.month}`);
  }
  const baselineMonthsUsed = monthsWithData.size;
  const baselineByCategory: Record<string, number> = {};
  let baselineAvg = 0;
  if (baselineMonthsUsed > 0) {
    for (const [categoryId, total] of sumByCategory) {
      const avg = total / baselineMonthsUsed;
      baselineByCategory[categoryId] = avg;
      baselineAvg += avg;
    }
  }
  const baselineTotal = months.map(() => baselineAvg);

  const income = await Promise.all(
    months.map((m) => getExpectedMonthlyIncome(householdId, m.year, m.month)),
  );

  const budgetsByCategoryYear = new Map<string, Map<number, number>>();
  const totalBudgetByYear: Record<number, number> = {};
  const budgetedBaselineByYear: Record<number, number> = {};
  for (const b of budgets) {
    const amount = Number(b.monthlyAmount);
    let perYear = budgetsByCategoryYear.get(b.categoryId);
    if (!perYear) {
      perYear = new Map();
      budgetsByCategoryYear.set(b.categoryId, perYear);
    }
    perYear.set(b.year, amount);
    totalBudgetByYear[b.year] = (totalBudgetByYear[b.year] ?? 0) + amount;
    budgetedBaselineByYear[b.year] =
      (budgetedBaselineByYear[b.year] ?? 0) +
      (baselineByCategory[b.categoryId] ?? 0);
  }

  // Headroom per horizon month: real income headroom once income exists,
  // otherwise budget headroom — budgets vs baseline restricted to budgeted
  // categories (comparing against total baseline would punish households
  // that budget only some categories). Years without budgets are
  // unmeasurable, not negative.
  const capacity: (number | null)[] = months.map((m, i) => {
    if (income[i] > 0) return income[i] - baselineTotal[i];
    if (totalBudgetByYear[m.year] === undefined) return null;
    return totalBudgetByYear[m.year] - (budgetedBaselineByYear[m.year] ?? 0);
  });

  const specs = dbItems.map((it) => ({
    ...it,
    amount: Number(it.amount),
  }));
  const impacts = specs.map((it) => expandItemImpact(it, months));
  const totalPlanned = months.map((_, i) =>
    impacts.reduce((sum, impact) => sum + impact[i], 0),
  );

  const items: ForecastItem[] = specs.map((it, idx) => {
    const impact = impacts[idx];
    let verdict: Verdict = "unknown";
    let worstRatio: number | null = null;
    let overByCapacity = false;
    for (let i = 0; i < months.length; i++) {
      if (impact[i] === 0) continue;
      const cap = capacity[i];
      if (cap === null) continue;
      if (cap <= 0) {
        overByCapacity = true;
        break;
      }
      const ratio = totalPlanned[i] / cap;
      if (worstRatio === null || ratio > worstRatio) worstRatio = ratio;
    }
    if (overByCapacity) verdict = "over";
    else if (worstRatio !== null) {
      verdict =
        worstRatio <= VERDICT_FITS_MAX
          ? "fits"
          : worstRatio <= VERDICT_TIGHT_MAX
            ? "tight"
            : "over";
    }

    let budgetImpact: BudgetImpactMonth[] | null = null;
    if (it.categoryId && expenseCategories.has(it.categoryId)) {
      const perYear = budgetsByCategoryYear.get(it.categoryId);
      const baseline = baselineByCategory[it.categoryId] ?? 0;
      budgetImpact = months
        .map((m, i) => ({
          year: m.year,
          month: m.month,
          budget: perYear?.get(m.year) ?? 0,
          baseline,
          planned: impact[i],
          projected: baseline + impact[i],
        }))
        .filter((b) => b.planned !== 0);
    }

    return {
      id: it.id,
      title: it.title,
      type: it.type,
      status: it.status,
      amount: it.amount,
      installments: it.installments,
      startYear: it.startYear,
      startMonth: it.startMonth,
      endYear: it.endYear,
      endMonth: it.endMonth,
      note: it.note,
      categoryId: it.categoryId,
      categoryName: it.categoryId
        ? (expenseCategories.get(it.categoryId) ?? null)
        : null,
      impact,
      verdict,
      budgetImpact,
    };
  });

  return {
    months,
    baselineTotal,
    baselineByCategory,
    baselineMonthsUsed,
    income,
    totalBudgetByYear,
    items,
  };
}
