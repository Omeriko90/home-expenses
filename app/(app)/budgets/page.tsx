import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/server";
import { getYears, resolveYear } from "@/lib/years";
import { BudgetEditor } from "@/components/features/budgets/budget-editor";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  await getDictionary();
  const years = await getYears();
  const year = resolveYear(years, sp.year);

  const [categories, budgets] = await Promise.all([
    prisma.category.findMany({
      where: { type: "EXPENSE", archived: false },
      orderBy: { name: "asc" },
    }),
    prisma.budget.findMany({ where: { year } }),
  ]);

  const budgetByCat = new Map(
    budgets.map((b) => [b.categoryId, Number(b.monthlyAmount)]),
  );

  const rows = categories.map((c) => ({
    categoryId: c.id,
    name: c.name,
    monthly: budgetByCat.get(c.id) ?? 0,
  }));

  return (
    <BudgetEditor year={year} years={years} rows={rows} />
  );
}
