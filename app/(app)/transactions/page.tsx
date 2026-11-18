import { prisma } from "@/lib/db";
import { resolveYearLoose, resolveMonth } from "@/lib/years";
import { requireUser } from "@/lib/session";
import { TransactionsView } from "@/components/features/transactions/transactions-view";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const { householdId } = await requireUser();
  const year = resolveYearLoose(sp.year);

  // Only the selected month is loaded — never the whole year.
  const monthsWithData = (
    await prisma.transaction.findMany({
      where: { year, householdId },
      distinct: ["month"],
      select: { month: true },
    })
  ).map((m) => m.month);
  const month = resolveMonth(monthsWithData, year, sp.month);

  const [categories, transactions] = await Promise.all([
    prisma.category.findMany({
      where: { householdId },
      orderBy: [{ archived: "asc" }, { name: "asc" }],
    }),
    prisma.transaction.findMany({
      where: { year, month, householdId },
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
    archived: c.archived,
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
