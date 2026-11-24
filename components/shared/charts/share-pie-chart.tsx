"use client";

import * as React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { formatMoneyCompact, formatPercent } from "@/lib/utils";
import { colorFor } from "./chart-palette";
import { ChartTooltip } from "./chart-tooltip";

export type ShareSlice = { name: string; value: number; color?: string | null };

const MAX_LEGEND_ITEMS = 8;

export function SharePieChart({
  data,
  mode = "percent",
}: {
  data: ShareSlice[];
  mode?: "money" | "percent";
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = React.useState(false);

  const total = data.reduce((s, d) => s + d.value, 0);
  const collapsible = data.length > MAX_LEGEND_ITEMS;
  const shown = expanded ? data : data.slice(0, MAX_LEGEND_ITEMS);

  return (
    <div className="flex flex-col gap-2 lg:h-full lg:flex-row lg:items-stretch lg:gap-4">
      <div className="h-64 sm:h-72 lg:h-auto lg:min-h-0 lg:flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="45%"
              outerRadius="80%"
              paddingAngle={2}
              strokeWidth={0}
              label={({ percent, value }) =>
                percent !== undefined && percent >= 0.04
                  ? mode === "money"
                    ? formatMoneyCompact(Number(value))
                    : `${Math.round(percent * 100)}%`
                  : ""
              }
              labelLine={false}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={colorFor(d.color, i)} />
              ))}
            </Pie>
            <Tooltip
              content={
                <ChartTooltip
                  formatter={
                    mode === "percent"
                      ? (v) => formatPercent(total > 0 ? v / total : 0)
                      : undefined
                  }
                />
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5 lg:w-36 lg:shrink-0 lg:flex-col lg:flex-nowrap lg:items-start lg:gap-y-1.5 lg:overflow-y-auto">
        {shown.map((d, i) => (
          <li
            key={d.name}
            className="flex items-center gap-1.5 text-xs lg:min-w-0 lg:shrink-0"
          >
            <span
              className="inline-block size-2 shrink-0 rounded-full"
              style={{ backgroundColor: colorFor(d.color, i) }}
            />
            <span dir="auto" className="lg:min-w-0 lg:break-words">
              {d.name}
            </span>
          </li>
        ))}
        {collapsible && (
          <li>
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {expanded
                ? t.common.showLess
                : t.common.showAll.replace("{n}", String(data.length))}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
