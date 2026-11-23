import { prisma } from "@/lib/db";
import { getForecast, type RangeMonths } from "@/lib/forecast";
import { requireUser } from "@/lib/session";
import { PlanningView } from "@/components/features/planning/planning-view";

function resolveRange(requested?: string | string[]): RangeMonths {
  const raw = Array.isArray(requested) ? requested[0] : requested;
  const parsed = raw ? Number(raw) : NaN;
  if (parsed === 6 || parsed === 12 || parsed === 24) return parsed;
  return 12;
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: requestedRange } = await searchParams;
  const { householdId } = await requireUser();
  const range = resolveRange(requestedRange);

  const [forecast, archivedItems, categories] = await Promise.all([
    getForecast(householdId, range),
    prisma.plannedItem.findMany({
      where: { householdId, status: { not: "ACTIVE" } },
      orderBy: { createdAt: "desc" },
      include: { category: { select: { name: true } } },
    }),
    prisma.category.findMany({
      where: { type: "EXPENSE", archived: false, householdId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const archived = archivedItems.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    status: item.status,
    amount: Number(item.amount),
    installments: item.installments,
    startYear: item.startYear,
    startMonth: item.startMonth,
    endYear: item.endYear,
    endMonth: item.endMonth,
    note: item.note,
    categoryId: item.categoryId,
    categoryName: item.category?.name ?? null,
  }));

  return (
    <PlanningView
      range={range}
      forecast={forecast}
      archived={archived}
      categories={categories}
    />
  );
}
