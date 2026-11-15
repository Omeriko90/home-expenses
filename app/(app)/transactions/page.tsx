import { prisma } from "@/lib/db";
import { resolveYearLoose, resolveMonth } from "@/lib/years";
import { TransactionsView } from "@/components/features/transactions/transactions-view";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const year = resolveYearLoose(sp.year);

  // Only the selected month is loaded — never the whole year.
  const monthsWithData = (
    await prisma.transaction.findMany({
      where: { year },
      distinct: ["month"],
      select: { month: true },
    })
  ).map((m) => m.month);
  const month = resolveMonth(monthsWithData, year, sp.month);

  const [categories, transactions] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.transaction.findMany({
      where: { year, month },
      orderBy: { date: "desc" },
      include: { category: { select: { name: true } } },
    }),
  ]);

  const rows = transactions.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    businessName: t.businessName,
    amount: Number(t.amount),
    categoryId: t.categoryId,
    categoryName: t.category.name,
    kind: t.kind,
    month: t.month,
    note: t.note,
  }));

  const cats = categories.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
  }));

  return (
    <TransactionsView
      year={year}
      month={month}
      categories={cats}
      rows={rows}
    />
  );
}
