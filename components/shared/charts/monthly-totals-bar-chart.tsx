"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { formatMoneyCompact, shortMonths } from "@/lib/utils";
import { ChartTooltip } from "./chart-tooltip";
import { EXPENSE_COLOR, NEUTRAL_COLOR, GRID_COLOR } from "./chart-palette";

/** Total household spend per month, selected year vs the previous one. */
export function MonthlyTotalsBarChart({
  year,
  totalsCurrent,
  totalsPrevious,
}: {
  year: number;
  totalsCurrent: number[];
  totalsPrevious: number[];
}) {
  const { locale } = useI18n();
  const data = shortMonths(locale).map((month, i) => ({
    month,
    previous: totalsPrevious[i],
    current: totalsCurrent[i],
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, left: 4, right: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="month" interval={0} tick={{ fontSize: 10 }} tickMargin={4} tickLine={false} />
        <YAxis
          tickFormatter={formatMoneyCompact}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          content={<ChartTooltip />}
          shared
          cursor={{ fill: GRID_COLOR, opacity: 0.4 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span className="text-xs text-foreground">{value}</span>
          )}
        />
        <Bar dataKey="previous" name={String(year - 1)} fill={NEUTRAL_COLOR} radius={[3, 3, 0, 0]} />
        <Bar dataKey="current" name={String(year)} fill={EXPENSE_COLOR} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
