"use client";

import { formatMoney } from "@/lib/utils";
import { useChartDirection } from "./use-chart-direction";

type TooltipEntry = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

export function ChartTooltip({
  active,
  payload,
  label,
  formatter = formatMoney,
  totalLabel,
  totalKeys,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  formatter?: (value: number) => string;
  totalLabel?: string;
  totalKeys?: string[];
}) {
  const { isRtl } = useChartDirection();
  if (!active || !payload?.length) return null;
  const totalEntries = totalKeys
    ? payload.filter(
        (entry) => entry.dataKey != null && totalKeys.includes(String(entry.dataKey)),
      )
    : payload;
  const total = totalEntries.reduce(
    (sum, entry) => sum + (entry.value == null ? 0 : Number(entry.value)),
    0,
  );
  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm"
    >
      {label !== undefined && label !== "" && (
        <p className="mb-1 font-medium">{label}</p>
      )}
      <ul className="flex flex-col gap-0.5">
        {payload.map((entry, i) => (
          <li key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="tnum font-medium">
              {entry.value == null ? "—" : formatter(Number(entry.value))}
            </span>
          </li>
        ))}
        {totalLabel && (
          <li className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-1">
            <span className="font-medium">{totalLabel}</span>
            <span className="tnum font-semibold">{formatter(total)}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
