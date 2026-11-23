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
import {
  cn,
  formatMoneyCompact,
  formatPercent,
  formatPercentCompact,
  shortMonths,
} from "@/lib/utils";
import type { MonthlyCategorySpend } from "@/lib/summary";
import { colorFor, DISABLED_COLOR, GRID_COLOR } from "./chart-palette";
import { ChartTooltip } from "./chart-tooltip";

const DEFAULT_VISIBLE = 6;
const MAX_LEGEND_ITEMS = 8;

export function CategoryMonthlyLineChart({
  monthly,
  mode,
}: {
  monthly: MonthlyCategorySpend;
  mode: "money" | "percent";
}) {
  const { t, locale } = useI18n();
  const [expanded, setExpanded] = React.useState(false);
  const [visible, setVisible] = React.useState<Set<string>>(
    () =>
      new Set(
        monthly.categories.slice(0, DEFAULT_VISIBLE).map((c) => c.categoryId),
      ),
  );

  const percent = mode === "percent";
  const months = shortMonths(locale);
  const data = monthly.byMonth.map((m, i) => {
    const floored = Object.entries(m).map(
      ([id, v]) => [id, Math.max(0, v)] as const,
    );
    const monthTotal = floored.reduce((s, [, v]) => s + v, 0);
    return {
      month: months[i],
      ...Object.fromEntries(
        floored.map(([id, v]) => [
          id,
          percent ? (monthTotal > 0 ? v / monthTotal : null) : v,
        ]),
      ),
    };
  });
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
    <div className="flex flex-col gap-2 lg:h-full lg:flex-row lg:items-stretch lg:gap-4">
      <div className="h-64 sm:h-72 lg:h-auto lg:min-h-0 lg:flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, left: 12, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="month" interval={0} tick={{ fontSize: 10 }} tickMargin={4} tickLine={false} />
            <YAxis
              tickFormatter={percent ? formatPercentCompact : formatMoneyCompact}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip
              content={<ChartTooltip formatter={percent ? formatPercent : undefined} />}
            />
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
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5 lg:w-48 lg:shrink-0 lg:flex-col lg:flex-nowrap lg:items-start lg:gap-y-1.5 lg:overflow-y-auto">
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
                    backgroundColor: hidden ? DISABLED_COLOR : colorFor(c.color, i),
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
