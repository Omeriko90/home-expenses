"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { formatMoneyCompact } from "@/lib/utils";
import { ChartTooltip } from "@/components/shared/charts/chart-tooltip";
import { useChartDirection } from "@/components/shared/charts/use-chart-direction";
import {
  EXPENSE_COLOR,
  GRID_COLOR,
  CHART_COLORS,
} from "@/components/shared/charts/chart-palette";
import { formatMonthKey, type MonthKey } from "./types";

const PLANNED_COLOR = CHART_COLORS[0];
const INCOME_COLOR = CHART_COLORS[3];

export function ForecastChart({
  months,
  baseline,
  planned,
  income,
}: {
  months: MonthKey[];
  baseline: number[];
  planned: number[];
  income: number[];
}) {
  const { t } = useI18n();
  const { xAxisReversed, yAxisOrientation } = useChartDirection();
  const hasIncome = income.some((v) => v > 0);
  const data = months.map((m, i) => ({
    month: formatMonthKey(m.year, m.month),
    baseline: baseline[i],
    planned: planned[i],
    income: income[i],
    net: income[i] - baseline[i] - planned[i],
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 4, left: 4, right: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="month"
          reversed={xAxisReversed}
          interval="preserveStartEnd"
          tick={{ fontSize: 10 }}
          tickMargin={4}
          tickLine={false}
        />
        <YAxis
          orientation={yAxisOrientation}
          tickFormatter={formatMoneyCompact}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          content={
            <ChartTooltip
              totalLabel={t.common.total}
              totalKeys={["baseline", "planned"]}
            />
          }
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
        <Bar
          dataKey="baseline"
          name={t.planning.baseline}
          stackId="spend"
          fill={EXPENSE_COLOR}
        />
        <Bar
          dataKey="planned"
          name={t.planning.plannedSpend}
          stackId="spend"
          fill={PLANNED_COLOR}
          radius={[3, 3, 0, 0]}
        />
        {hasIncome && (
          <Line
            dataKey="income"
            name={t.planning.expectedIncome}
            stroke={INCOME_COLOR}
            strokeWidth={2}
            dot={false}
          />
        )}
        {hasIncome && (
          <Line
            dataKey="net"
            name={t.planning.net}
            stroke={GRID_COLOR}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
