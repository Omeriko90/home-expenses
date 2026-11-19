import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { CategoryManager } from "@/components/features/categories/category-manager";

export default async function CategoriesPage() {
  const { householdId } = await requireUser();
  const year = new Date().getFullYear();
  const [categories, yearSpend, lastUsed] = await Promise.all([
    prisma.category.findMany({
      where: { householdId },
      orderBy: [{ archived: "asc" }, { name: "asc" }],
      include: { _count: { select: { transactions: true } } },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { householdId, year },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { householdId },
      _max: { date: true },
    }),
  ]);

  const spendByCategory = new Map(
    yearSpend.map((r) => [r.categoryId, Number(r._sum.amount ?? 0)]),
  );
  const lastUsedByCategory = new Map(
    lastUsed.map((r) => [r.categoryId, r._max.date?.toISOString() ?? null]),
  );

  const data = categories.map((c) => ({
    id: c.id,
    name: c.name,
    nameEn: c.nameEn,
    description: c.description,
    type: c.type,
    color: c.color,
    archived: c.archived,
    txCount: c._count.transactions,
    yearSpend: spendByCategory.get(c.id) ?? 0,
    lastUsed: lastUsedByCategory.get(c.id) ?? null,
  }));

  return <CategoryManager initial={data} />;
}
