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
    value: number;
  }[];
};

export async function getPortfolioSummaries(
  year: number,
): Promise<PortfolioSummary[]> {
  const portfolios = await prisma.portfolio.findMany({
    where: { archived: false },
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
        value: cur ? Number(cur.value) : 0,
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
  current: number;
  previous: number;
  change: number;
  changePct: number | null;
};

/** Per-category expense totals for `year` vs `year-1`. */
export async function getCategorySpend(
  year: number,
): Promise<CategorySpendRow[]> {
  const categories = await prisma.category.findMany({
    where: { type: "EXPENSE" },
    select: { id: true, name: true },
  });

  const [cur, prev] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { year },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { year: year - 1 },
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
        current,
        previous,
        change: current - previous,
        changePct: yoyPercent(current, previous),
      };
    })
    .filter((r) => r.current !== 0 || r.previous !== 0)
    .sort((a, b) => b.current - a.current);
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
): Promise<CategoryMonthlySpend> {
  const rows = await prisma.transaction.groupBy({
    by: ["year", "month"],
    where: { categoryId, year: { in: [year, year - 1] } },
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

/** Total of current investment value across all portfolios for a year. */
export async function getInvestmentTotal(year: number): Promise<number> {
  const summaries = await getPortfolioSummaries(year);
  return summaries.reduce((s, p) => s + p.value, 0);
}

/** How many of the year's goals are reached, out of the total. */
export async function getGoalStats(
  year: number,
): Promise<{ reached: number; total: number }> {
  const goals = await prisma.goal.findMany({
    where: { year },
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
        where: { categoryId: g.linkCategoryId, year },
      });
      current = Number(agg._sum.amount ?? 0);
    } else if (g.linkKind === "INVESTMENT_TOTAL") {
      if (investmentTotal === null) investmentTotal = await getInvestmentTotal(year);
      current = investmentTotal;
    }
    const target = g.targetAmount ? Number(g.targetAmount) : 0;
    if (target > 0 && current >= target) reached++;
  }

  return { reached, total: goals.length };
}
