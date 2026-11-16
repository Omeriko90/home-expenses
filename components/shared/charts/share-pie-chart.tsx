"use client";

import * as React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { colorFor } from "./chart-palette";
import { ChartTooltip } from "./chart-tooltip";

export type ShareSlice = { name: string; value: number; color?: string | null };

const MAX_LEGEND_ITEMS = 8;

/** "Share of total" pie — used for category spend, channels, and portfolios. */
export function SharePieChart({ data }: { data: ShareSlice[] }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = React.useState(false);

  const total = data.reduce((s, d) => s + d.value, 0);
  const collapsible = data.length > MAX_LEGEND_ITEMS;
  const shown = expanded ? data : data.slice(0, MAX_LEGEND_ITEMS);

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="min-h-0 flex-1">
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
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {shown.map((d, i) => (
          <li key={d.name} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block size-2 shrink-0 rounded-full"
              style={{ backgroundColor: colorFor(d.color, i) }}
            />
            <span dir="auto">
              {d.name}
              {total > 0 && ` · ${Math.round((d.value / total) * 100)}%`}
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
