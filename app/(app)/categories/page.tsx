import { prisma } from "@/lib/db";
import { CategoryManager } from "@/components/features/categories/category-manager";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ archived: "asc" }, { name: "asc" }],
    include: { _count: { select: { transactions: true } } },
  });

  const data = categories.map((c) => ({
    id: c.id,
    name: c.name,
    nameEn: c.nameEn,
    description: c.description,
    type: c.type,
    archived: c.archived,
    txCount: c._count.transactions,
  }));

  return <CategoryManager initial={data} />;
}
