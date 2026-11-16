"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { formatMoneyCompact } from "@/lib/utils";
import type { MonthlyCategorySpend } from "@/lib/summary";
import { colorFor, GRID_COLOR } from "./chart-palette";
import { ChartTooltip } from "./chart-tooltip";

const DEFAULT_VISIBLE = 6;

/** Monthly spend per category; top categories visible, legend toggles the rest. */
export function CategoryMonthlyLineChart({
  monthly,
}: {
  monthly: MonthlyCategorySpend;
}) {
  const { t } = useI18n();
  const [visible, setVisible] = React.useState<Set<string>>(
    () =>
      new Set(
        monthly.categories.slice(0, DEFAULT_VISIBLE).map((c) => c.categoryId),
      ),
  );

  const data = monthly.byMonth.map((m, i) => ({ month: t.months[i], ...m }));

  function toggle(categoryId: string) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  return (
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
        <Legend
          iconType="plainline"
          iconSize={12}
          itemSorter={null}
          onClick={(entry) => {
            const key = (entry as { dataKey?: unknown }).dataKey;
            if (typeof key === "string") toggle(key);
          }}
          formatter={(value: string, entry) => {
            const key = (entry as { dataKey?: unknown }).dataKey;
            const hidden = typeof key === "string" && !visible.has(key);
            return (
              <span
                className={
                  hidden
                    ? "cursor-pointer text-xs text-disabled"
                    : "cursor-pointer text-xs text-foreground"
                }
              >
                {value}
              </span>
            );
          }}
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
  );
}
