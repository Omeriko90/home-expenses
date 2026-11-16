"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { colorFor } from "./chart-palette";
import { ChartTooltip } from "./chart-tooltip";

export type ShareSlice = { name: string; value: number; color?: string | null };

/** "Share of total" pie — used for category spend, channels, and portfolios. */
export function SharePieChart({ data }: { data: ShareSlice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="45%"
          outerRadius="80%"
          paddingAngle={2}
          strokeWidth={0}
          label={({ percent }) =>
            percent !== undefined && percent >= 0.04
              ? `${Math.round(percent * 100)}%`
              : ""
          }
          labelLine={false}
        >
          {data.map((d, i) => (
            <Cell key={d.name} fill={colorFor(d.color, i)} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          itemSorter={null}
          formatter={(value: string) => {
            const slice = data.find((d) => d.name === value);
            const pct =
              slice && total > 0
                ? ` · ${Math.round((slice.value / total) * 100)}%`
                : "";
            return (
              <span className="text-xs text-foreground">
                {value}
                {pct}
              </span>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
