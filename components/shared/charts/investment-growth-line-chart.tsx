"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { formatMoneyCompact } from "@/lib/utils";
import type { YearlyInvestmentTotal } from "@/lib/summary";
import { ChartTooltip } from "./chart-tooltip";
import { INVESTMENT_COLOR, GRID_COLOR } from "./chart-palette";

/** Total investment value per year across all portfolios. */
export function InvestmentGrowthLineChart({
  totals,
}: {
  totals: YearlyInvestmentTotal[];
}) {
  const { t } = useI18n();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={totals} margin={{ top: 4, left: 4, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis
          tickFormatter={formatMoneyCompact}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Tooltip content={<ChartTooltip />} />
        <Line
          dataKey="total"
          name={t.summary.totalInvestments}
          stroke={INVESTMENT_COLOR}
          strokeWidth={2.5}
          dot={{ r: 4, fill: INVESTMENT_COLOR, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
