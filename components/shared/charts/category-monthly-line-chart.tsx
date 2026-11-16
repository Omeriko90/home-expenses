"use client";

import * as React from "react";
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
import { cn, formatMoneyCompact } from "@/lib/utils";
import type { MonthlyCategorySpend } from "@/lib/summary";
import { colorFor, GRID_COLOR } from "./chart-palette";
import { ChartTooltip } from "./chart-tooltip";

const DEFAULT_VISIBLE = 6;
const MAX_LEGEND_ITEMS = 8;

/** Monthly spend per category; top categories visible, legend toggles the rest. */
export function CategoryMonthlyLineChart({
  monthly,
}: {
  monthly: MonthlyCategorySpend;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = React.useState(false);
  const [visible, setVisible] = React.useState<Set<string>>(
    () =>
      new Set(
        monthly.categories.slice(0, DEFAULT_VISIBLE).map((c) => c.categoryId),
      ),
  );

  // Refund months can net negative; the chart shows spend, so floor at 0.
  const data = monthly.byMonth.map((m, i) => ({
    month: t.months[i],
    ...Object.fromEntries(
      Object.entries(m).map(([id, v]) => [id, Math.max(0, v)]),
    ),
  }));
  const collapsible = monthly.categories.length > MAX_LEGEND_ITEMS;
  const shown = expanded
    ? monthly.categories
    : monthly.categories.slice(0, MAX_LEGEND_ITEMS);

  function toggle(categoryId: string) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, left: 4, right: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis
              tickFormatter={formatMoneyCompact}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip content={<ChartTooltip />} />
            {monthly.categories.map((c, i) => (
              <Line
                key={c.categoryId}
                dataKey={c.categoryId}
                name={c.name}
                stroke={colorFor(c.color, i)}
                strokeWidth={2}
                dot={false}
                hide={!visible.has(c.categoryId)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {shown.map((c, i) => {
          const hidden = !visible.has(c.categoryId);
          return (
            <li key={c.categoryId}>
              <button
                type="button"
                onClick={() => toggle(c.categoryId)}
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  hidden ? "text-disabled" : "text-foreground",
                )}
              >
                <span
                  className="inline-block h-0.5 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: hidden ? "#b9b4be" : colorFor(c.color, i),
                  }}
                />
                <span dir="auto">{c.name}</span>
              </button>
            </li>
          );
        })}
        {collapsible && (
          <li>
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {expanded
                ? t.common.showLess
                : t.common.showAll.replace(
                    "{n}",
                    String(monthly.categories.length),
                  )}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
