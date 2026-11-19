import type { PortfolioGroup } from "@prisma/client";
import { prisma } from "@/lib/db";
import { yoyPercent } from "@/lib/utils";

export type PortfolioSummary = {
  id: string;
  name: string;
  group: "MAIN" | "KIDS";
  value: number;
  prevValue: number;
  deposits: number;
  change: number;
  changePct: number | null;
  returnPct: number | null; // (value - prevValue) / prevValue — matches the sheet
  holdings: {
    id: string;
    channel: string;
    instrument: string;
    house: string;
    type: string;
    value: number;
    prevValue: number;
  }[];
};

export async function getPortfolioSummaries(
  year: number,
  householdId: string,
): Promise<PortfolioSummary[]> {
  const portfolios = await prisma.portfolio.findMany({
    where: { archived: false, householdId },
    orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
    include: {
      holdings: { include: { snapshots: true }, orderBy: { sortOrder: "asc" } },
      years: true,
    },
  });

  return portfolios.map((p) => {
    let value = 0;
    let prevValue = 0;
    const holdings = p.holdings.map((h) => {
      const cur = h.snapshots.find((s) => s.year === year);
      const prev = h.snapshots.find((s) => s.year === year - 1);
      value += cur ? Number(cur.value) : 0;
      prevValue += prev ? Number(prev.value) : 0;
      return {
        id: h.id,
        channel: h.channel,
        instrument: h.instrument,
        house: h.house,
        type: h.type,
        value: cur ? Number(cur.value) : 0,
        prevValue: prev ? Number(prev.value) : 0,
      };
    });
    const deposits = Number(
      p.years.find((y) => y.year === year)?.deposits ?? 0,
    );
    const change = value - prevValue;
    return {
      id: p.id,
      name: p.name,
      group: p.group,
      value,
      prevValue,
      deposits,
      change,
      changePct: yoyPercent(value, prevValue),
      returnPct: yoyPercent(value, prevValue),
      holdings,
    };
  });
}

export type CategorySpendRow = {
  categoryId: string;
  name: string;
  color: string | null;
  current: number;
  previous: number;
  change: number;
  changePct: number | null;
};

/** Per-category expense totals for `year` vs `year-1`. */
export async function getCategorySpend(
  year: number,
  householdId: string,
): Promise<CategorySpendRow[]> {
  const categories = await prisma.category.findMany({
    where: { type: "EXPENSE", householdId },
    select: { id: true, name: true, color: true },
  });

  const [cur, prev] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { year, householdId },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { year: year - 1, householdId },
      _sum: { amount: true },
    }),
  ]);

  const curMap = new Map(cur.map((r) => [r.categoryId, Number(r._sum.amount ?? 0)]));
  const prevMap = new Map(prev.map((r) => [r.categoryId, Number(r._sum.amount ?? 0)]));

  return categories
    .map((c) => {
      const current = curMap.get(c.id) ?? 0;
      const previous = prevMap.get(c.id) ?? 0;
      return {
        categoryId: c.id,
        name: c.name,
        color: c.color,
        current,
        previous,
        change: current - previous,
        changePct: yoyPercent(current, previous),
      };
    })
    .filter((r) => r.current !== 0 || r.previous !== 0)
    .sort((a, b) => b.current - a.current);
}

export type BudgetActuals = {
  mode: "month" | "average";
  month: number;
  byCategory: Record<string, number>;
};

export async function getBudgetActuals(
  year: number,
  householdId: string,
): Promise<BudgetActuals> {
  const now = new Date();
  const isCurrentYear = year === now.getFullYear();
  const month = now.getMonth() + 1;

  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { householdId, year, ...(isCurrentYear ? { month } : {}) },
    _sum: { amount: true },
  });

  const byCategory: Record<string, number> = {};
  for (const r of grouped) {
    const total = Number(r._sum.amount ?? 0);
    byCategory[r.categoryId] = isCurrentYear ? total : total / 12;
  }

  return { mode: isCurrentYear ? "month" : "average", month, byCategory };
}

export type CategoryMonthlySpend = {
  /** 12 entries, index 0 = January; 0 when the month has no transactions. */
  current: number[];
  previous: number[];
};

/** Per-month expense totals for one category, `year` vs `year-1`. */
export async function getCategoryMonthlySpend(
  categoryId: string,
  year: number,
  householdId: string,
): Promise<CategoryMonthlySpend> {
  const rows = await prisma.transaction.groupBy({
    by: ["year", "month"],
    where: { categoryId, householdId, year: { in: [year, year - 1] } },
    _sum: { amount: true },
  });

  const current = Array<number>(12).fill(0);
  const previous = Array<number>(12).fill(0);
  for (const r of rows) {
    const target = r.year === year ? current : previous;
    target[r.month - 1] = Number(r._sum.amount ?? 0);
  }
  return { current, previous };
}

export type MonthlyCategorySpend = {
  /** Expense categories with spend in `year`, sorted by total descending. */
  categories: {
    categoryId: string;
    name: string;
    color: string | null;
    total: number;
  }[];
  /** 12 entries, index 0 = January; byMonth[m][categoryId] = spend in `year`. */
  byMonth: Record<string, number>[];
  /** Total household spend per month, 12 entries each. */
  totalsCurrent: number[];
  totalsPrevious: number[];
};

/** Per-month expense totals for all categories, `year` vs `year-1`. */
export async function getMonthlyCategorySpend(
  year: number,
  householdId: string,
): Promise<MonthlyCategorySpend> {
  const [categories, rows] = await Promise.all([
    prisma.category.findMany({
      where: { type: "EXPENSE", householdId },
      select: { id: true, name: true, color: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId", "year", "month"],
      where: { householdId, year: { in: [year, year - 1] } },
      _sum: { amount: true },
    }),
  ]);

  const expenseIds = new Map(categories.map((c) => [c.id, c]));
  const byMonth: Record<string, number>[] = Array.from({ length: 12 }, () => ({}));
  const totalsCurrent = Array<number>(12).fill(0);
  const totalsPrevious = Array<number>(12).fill(0);
  const totals = new Map<string, number>();

  for (const r of rows) {
    if (!expenseIds.has(r.categoryId)) continue;
    const amount = Number(r._sum.amount ?? 0);
    const m = r.month - 1;
    if (r.year === year) {
      byMonth[m][r.categoryId] = (byMonth[m][r.categoryId] ?? 0) + amount;
      totalsCurrent[m] += amount;
      totals.set(r.categoryId, (totals.get(r.categoryId) ?? 0) + amount);
    } else {
      totalsPrevious[m] += amount;
    }
  }

  const kept = categories
    .map((c) => ({
      categoryId: c.id,
      name: c.name,
      color: c.color,
      total: totals.get(c.id) ?? 0,
    }))
    .filter((c) => c.total !== 0)
    .sort((a, b) => b.total - a.total);

  // Months without transactions chart as 0 rather than a broken line.
  for (const m of byMonth) {
    for (const c of kept) m[c.categoryId] ??= 0;
  }

  return { categories: kept, byMonth, totalsCurrent, totalsPrevious };
}

export type YearlyInvestmentTotal = {
  year: number;
  type: string;
  group: PortfolioGroup;
  total: number;
};

/** Investment value per year, holding type and portfolio group across all active portfolios. */
export async function getYearlyInvestmentTotals(
  householdId: string,
): Promise<YearlyInvestmentTotal[]> {
  const snapshots = await prisma.holdingSnapshot.findMany({
    where: { holding: { portfolio: { householdId, archived: false } } },
    select: {
      year: true,
      value: true,
      holding: { select: { type: true, portfolio: { select: { group: true } } } },
    },
  });

  const totals = new Map<string, YearlyInvestmentTotal>();
  for (const s of snapshots) {
    const key = `${s.year}:${s.holding.type}:${s.holding.portfolio.group}`;
    const row = totals.get(key) ?? {
      year: s.year,
      type: s.holding.type,
      group: s.holding.portfolio.group,
      total: 0,
    };
    row.total += Number(s.value);
    totals.set(key, row);
  }
  return [...totals.values()]
    .filter((r) => r.total !== 0)
    .sort((a, b) => a.year - b.year);
}

/** Total of current investment value across all portfolios for a year. */
export async function getInvestmentTotal(
  year: number,
  householdId: string,
): Promise<number> {
  const summaries = await getPortfolioSummaries(year, householdId);
  return summaries.reduce((s, p) => s + p.value, 0);
}

/** How many of the year's goals are reached, out of the total. */
export async function getGoalStats(
  year: number,
  householdId: string,
): Promise<{ reached: number; total: number }> {
  const goals = await prisma.goal.findMany({
    where: { year, householdId },
    include: { milestones: true },
  });

  let reached = 0;
  let investmentTotal: number | null = null;

  for (const g of goals) {
    if (g.type === "CHECKLIST") {
      if (g.milestones.length > 0 && g.milestones.every((m) => m.done)) reached++;
      continue;
    }
    // NUMERIC — resolve current (manual, linked category, or investment total).
    let current = g.currentAmount ? Number(g.currentAmount) : 0;
    if (g.linkKind === "CATEGORY" && g.linkCategoryId) {
      const agg = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { categoryId: g.linkCategoryId, year, householdId },
      });
      current = Number(agg._sum.amount ?? 0);
    } else if (g.linkKind === "INVESTMENT_TOTAL") {
      if (investmentTotal === null)
        investmentTotal = await getInvestmentTotal(year, householdId);
      current = investmentTotal;
    }
    const target = g.targetAmount ? Number(g.targetAmount) : 0;
    if (target > 0 && current >= target) reached++;
  }

  return { reached, total: goals.length };
}
