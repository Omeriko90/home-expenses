"use client";

import { useI18n } from "@/lib/i18n/context";
import { formatMoney, formatPercent, yoyPercent } from "@/lib/utils";
import type { PortfolioSummary } from "@/lib/summary";
import { StatCard } from "@/components/shared/stat-card";
import { ChangeIndicator } from "@/components/shared/change-indicator";

export function GroupSummaryCards({
  portfolios,
  typeFilter,
}: {
  portfolios: PortfolioSummary[];
  typeFilter: string | null;
}) {
  const { t } = useI18n();

  let value = 0;
  let prevValue = 0;
  let deposits = 0;
  for (const p of portfolios) {
    if (typeFilter) {
      const holdings = p.holdings.filter((h) => h.type === typeFilter);
      value += holdings.reduce((s, h) => s + h.value, 0);
      prevValue += holdings.reduce((s, h) => s + h.prevValue, 0);
    } else {
      value += p.value;
      prevValue += p.prevValue;
      deposits += p.deposits;
    }
  }
  const change = value - prevValue;
  const changePct = yoyPercent(value, prevValue);
  const returnPct = yoyPercent(value, prevValue);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t.common.total}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t.investments.currentValue}
          value={formatMoney(value)}
          accent="investment"
        />
        <StatCard
          label={t.investments.deposits}
          value={typeFilter ? "—" : formatMoney(deposits)}
        />
        <StatCard
          label={t.investments.changeYoy}
          value={formatMoney(change, { sign: true })}
          accent="investment"
          sub={<ChangeIndicator amount={change} pct={changePct} mode="percent" />}
        />
        <StatCard
          label={t.investments.return}
          value={returnPct === null ? "—" : formatPercent(returnPct, { sign: true })}
          accent="investment"
        />
      </div>
    </div>
  );
}
