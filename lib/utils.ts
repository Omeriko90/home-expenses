import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as ILS currency (₪). */
export function formatMoney(
  value: number | string,
  opts: { decimals?: boolean; sign?: boolean } = {},
): string {
  const n = typeof value === "string" ? Number(value) : value;
  const { decimals = false, sign = false } = opts;
  const formatted = new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(Math.abs(n));
  if (sign && n !== 0) return `${n > 0 ? "+" : "-"}${formatted}`;
  return n < 0 ? `-${formatted}` : formatted;
}

/** Compact ₪ format for chart axis ticks (e.g. ‎₪12K). */
export function formatMoneyCompact(value: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Format a ratio (e.g. 0.23) as a percentage string. */
export function formatPercent(value: number, opts: { sign?: boolean } = {}): string {
  const pct = value * 100;
  const str = `${Math.abs(pct).toFixed(1)}%`;
  if (opts.sign && pct !== 0) return `${pct > 0 ? "+" : "-"}${str}`;
  return pct < 0 ? `-${str}` : str;
}

/** Compact % for chart axis ticks (ratio → "25%"). */
export function formatPercentCompact(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function shortMonths(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: "short" });
  return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(2026, m, 1)));
}

/** Year-over-year percentage change, guarding divide-by-zero. */
export function yoyPercent(current: number, previous: number): number | null {
  if (previous === 0) return null; // "new" / not comparable
  return (current - previous) / Math.abs(previous);
}
