import { getYears, resolveYear } from "@/lib/years";
import { getPortfolioSummaries, getYearlyInvestmentTotals } from "@/lib/summary";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { InvestmentsView } from "@/components/features/investments/investments-view";
import type {
  TxRow,
  TxCategory,
} from "@/components/features/transactions/transaction-form";

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const { householdId } = await requireUser();
  const years = await getYears(householdId);
  const year = resolveYear(years, sp.year);
  const [portfolios, yearlyTotals, investmentCategories, deposits] =
    await Promise.all([
      getPortfolioSummaries(year, householdId),
      getYearlyInvestmentTotals(householdId),
      prisma.category.findMany({
        where: { householdId, type: "INVESTMENT" },
        orderBy: [{ archived: "asc" }, { name: "asc" }],
        select: { id: true, name: true, type: true, archived: true },
      }),
      prisma.transaction.findMany({
        where: { householdId, year, portfolioId: { not: null } },
        orderBy: { date: "desc" },
        include: { category: { select: { name: true } } },
      }),
    ]);

  const depositsByPortfolio: Record<string, TxRow[]> = {};
  for (const d of deposits) {
    if (!d.portfolioId) continue;
    (depositsByPortfolio[d.portfolioId] ??= []).push({
      id: d.id,
      date: d.date.toISOString(),
      businessName: d.businessName,
      amount: Number(d.amount),
      categoryId: d.categoryId,
      categoryName: d.category.name,
      kind: d.kind,
      month: d.month,
      note: d.note,
    });
  }

  return (
    <InvestmentsView
      year={year}
      years={years}
      portfolios={portfolios}
      yearlyTotals={yearlyTotals}
      investmentCategories={investmentCategories as TxCategory[]}
      depositsByPortfolio={depositsByPortfolio}
    />
  );
}
