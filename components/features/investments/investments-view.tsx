"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { PortfolioSummary, YearlyInvestmentTotal } from "@/lib/summary";
import { EmptyState } from "@/components/shared/empty-state";
import { type AutocompleteOption } from "@/components/shared/autocomplete";
import { INVESTMENT_TYPE_PRESETS } from "@/lib/investment-types";
import type {
  TxRow,
  TxCategory,
} from "@/components/features/transactions/transaction-form";
import { Select } from "@/components/ui/select/Select";
import { InvestmentCharts } from "./investment-charts";
import { GroupSummaryCards } from "./group-summary-cards";
import { PortfolioSection } from "./portfolio-section";
import { YearSelect } from "@/components/shared/year-select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

export function InvestmentsView({
  year,
  years,
  portfolios,
  yearlyTotals,
  investmentCategories,
  depositsByPortfolio,
}: {
  year: number;
  years: number[];
  portfolios: PortfolioSummary[];
  yearlyTotals: YearlyInvestmentTotal[];
  investmentCategories: TxCategory[];
  depositsByPortfolio: Record<string, TxRow[]>;
}) {
  const { t } = useI18n();
  const [tab, setTab] = React.useState<"MAIN" | "KIDS">("MAIN");
  const [typeFilter, setTypeFilter] = React.useState<string | null>(null);

  const main = portfolios.filter((p) => p.group === "MAIN");
  const kids = portfolios.filter((p) => p.group === "KIDS");

  const usedTypes = [
    ...new Set(portfolios.flatMap((p) => p.holdings.map((h) => h.type))),
  ].filter(Boolean);
  const typeOptions: AutocompleteOption[] = [
    ...usedTypes,
    ...INVESTMENT_TYPE_PRESETS.filter((p) => !usedTypes.includes(p)),
  ].map((v) => ({ value: v, label: v }));

  if (portfolios.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-end">
          <YearSelect year={year} years={years} />
        </div>
        <EmptyState icon={<TrendingUp />} title={t.investments.empty} />
      </div>
    );
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
      <div className="flex items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="MAIN">{t.investments.main}</TabsTrigger>
          <TabsTrigger value="KIDS">{t.investments.kids}</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <Select
            value={typeFilter ?? "all"}
            onValueChange={(v) => setTypeFilter(v === "all" ? null : v)}
            className="w-44"
            options={[
              { value: "all", label: t.investments.allTypes },
              ...usedTypes.map((v) => ({ value: v, label: v })),
            ]}
          />
          <YearSelect year={year} years={years} />
        </div>
      </div>
      {(["MAIN", "KIDS"] as const).map((group) => {
        const groupPortfolios = group === "MAIN" ? main : kids;
        const shown = typeFilter
          ? groupPortfolios.filter((p) =>
              p.holdings.some((h) => h.type === typeFilter),
            )
          : groupPortfolios;
        return (
          <TabsContent key={group} value={group} className="flex flex-col gap-6">
            {shown.length === 0 ? (
              <EmptyState icon={<TrendingUp />} title={t.investments.empty} />
            ) : (
              <>
                <GroupSummaryCards portfolios={shown} typeFilter={typeFilter} />
                <InvestmentCharts
                  portfolios={groupPortfolios}
                  yearlyTotals={yearlyTotals}
                  group={group}
                  type={typeFilter}
                />
                {shown.map((p) => (
                  <PortfolioSection
                    key={p.id}
                    portfolio={p}
                    year={year}
                    typeFilter={typeFilter}
                    typeOptions={typeOptions}
                    investmentCategories={investmentCategories}
                    deposits={depositsByPortfolio[p.id] ?? []}
                  />
                ))}
              </>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
