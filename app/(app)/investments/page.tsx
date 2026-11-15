import { getYears, resolveYear } from "@/lib/years";
import { getPortfolioSummaries } from "@/lib/summary";
import { requireUser } from "@/lib/session";
import { InvestmentsView } from "@/components/features/investments/investments-view";

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const { householdId } = await requireUser();
  const years = await getYears(householdId);
  const year = resolveYear(years, sp.year);
  const portfolios = await getPortfolioSummaries(year, householdId);

  return (
    <InvestmentsView year={year} years={years} portfolios={portfolios} />
  );
}
