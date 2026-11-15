import { prisma } from "@/lib/db";
import { getYears, resolveYear } from "@/lib/years";
import { getInvestmentTotal } from "@/lib/summary";
import { requireUser } from "@/lib/session";
import { GoalsView } from "@/components/features/goals/goals-view";

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const { householdId } = await requireUser();
  const years = await getYears(householdId);
  const year = resolveYear(years, sp.year);

  const [goals, categories] = await Promise.all([
    prisma.goal.findMany({
      where: { year, householdId },
      orderBy: { createdAt: "asc" },
      include: {
        milestones: { orderBy: { sortOrder: "asc" } },
        linkCategory: { select: { id: true, name: true } },
      },
    }),
    prisma.category.findMany({
      where: { archived: false, householdId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Resolve "current" for linked numeric goals.
  let investmentTotal: number | null = null;
  const rows = await Promise.all(
    goals.map(async (g) => {
      let current = g.currentAmount ? Number(g.currentAmount) : 0;
      if (g.type === "NUMERIC" && g.linkKind === "CATEGORY" && g.linkCategoryId) {
        const agg = await prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { categoryId: g.linkCategoryId, year, householdId },
        });
        current = Number(agg._sum.amount ?? 0);
      } else if (g.type === "NUMERIC" && g.linkKind === "INVESTMENT_TOTAL") {
        if (investmentTotal === null)
          investmentTotal = await getInvestmentTotal(year, householdId);
        current = investmentTotal;
      }
      return {
        id: g.id,
        title: g.title,
        type: g.type,
        note: g.note,
        target: g.targetAmount ? Number(g.targetAmount) : null,
        current,
        linkKind: g.linkKind,
        linkCategoryId: g.linkCategoryId,
        linkCategoryName: g.linkCategory?.name ?? null,
        milestones: g.milestones.map((m) => ({
          id: m.id,
          title: m.title,
          done: m.done,
        })),
      };
    }),
  );

  return (
    <GoalsView year={year} years={years} goals={rows} categories={categories} />
  );
}
