import { prisma } from "@/lib/db";
import { getForecast, type HorizonMonths } from "@/lib/forecast";
import { requireUser } from "@/lib/session";
import { PlanningView } from "@/components/features/planning/planning-view";

function resolveHorizon(requested?: string | string[]): HorizonMonths {
  const raw = Array.isArray(requested) ? requested[0] : requested;
  const parsed = raw ? Number(raw) : NaN;
  if (parsed === 6 || parsed === 12 || parsed === 24) return parsed;
  return 12;
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ horizon?: string }>;
}) {
  const sp = await searchParams;
  const { householdId } = await requireUser();
  const horizon = resolveHorizon(sp.horizon);

  const [forecast, archivedItems, categories] = await Promise.all([
    getForecast(householdId, horizon),
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

  const archived = archivedItems.map((it) => ({
    id: it.id,
    title: it.title,
    type: it.type,
    status: it.status,
    amount: Number(it.amount),
    installments: it.installments,
    startYear: it.startYear,
    startMonth: it.startMonth,
    endYear: it.endYear,
    endMonth: it.endMonth,
    note: it.note,
    categoryId: it.categoryId,
    categoryName: it.category?.name ?? null,
  }));

  return (
    <PlanningView
      horizon={horizon}
      forecast={forecast}
      archived={archived}
      categories={categories}
    />
  );
}
