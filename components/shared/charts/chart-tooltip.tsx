"use client";

import { formatMoney } from "@/lib/utils";

type TooltipEntry = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

/** Custom recharts tooltip: ₪ amounts with tabular numerals, card styling. */
export function ChartTooltip({
  active,
  payload,
  label,
  formatter = formatMoney,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  formatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      dir="rtl"
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
      </ul>
    </div>
  );
}
