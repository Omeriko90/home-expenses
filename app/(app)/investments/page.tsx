import { getYears, resolveYear } from "@/lib/years";
import { getPortfolioSummaries } from "@/lib/summary";
import { InvestmentsView } from "@/components/features/investments/investments-view";

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const years = await getYears();
  const year = resolveYear(years, sp.year);
  const portfolios = await getPortfolioSummaries(year);

  return (
    <InvestmentsView year={year} years={years} portfolios={portfolios} />
  );
}
