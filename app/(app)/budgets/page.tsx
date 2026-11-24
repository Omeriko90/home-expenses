import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/server";
import { getPlanningYear, getYears, resolveYear, withYear } from "@/lib/years";
import { getBudgetActuals } from "@/lib/summary";
import { requireUser } from "@/lib/session";
import { BudgetEditor } from "@/components/features/budgets/budget-editor";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  await getDictionary();
  const { householdId } = await requireUser();
  const planningYear = getPlanningYear();
  const years = withYear(await getYears(householdId), planningYear);
  const year = resolveYear(years, sp.year);

  const [categories, budgets, actuals] = await Promise.all([
    prisma.category.findMany({
      where: { type: "EXPENSE", archived: false, householdId },
      orderBy: { name: "asc" },
    }),
    prisma.budget.findMany({ where: { year, category: { householdId } } }),
    getBudgetActuals(year, householdId),
  ]);

  const budgetByCat = new Map(
    budgets.map((b) => [b.categoryId, Number(b.monthlyAmount)]),
  );

  const rows = categories.map((c) => ({
    categoryId: c.id,
    name: c.name,
    monthly: budgetByCat.get(c.id) ?? 0,
    actual: actuals.byCategory[c.id] ?? 0,
  }));

  return (
    <BudgetEditor
      year={year}
      years={years}
      planningYear={planningYear}
      rows={rows}
      mode={actuals.mode}
      month={actuals.month}
    />
  );
}
