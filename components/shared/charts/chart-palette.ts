/**
 * Chart colors mirroring the Tailwind design tokens (tailwind.config.ts).
 * Kept as hex constants because recharts needs concrete color values.
 */
export const CHART_COLORS = [
  "#756487", // primary
  "#dfa5b1", // secondary
  "#e9c77d", // accent
  "#70b69d", // income
  "#9685bb", // investment
  "#e18f87", // expense
  "#52769f", // info
  "#347b65", // success
  "#98702d", // warning
  "#b85f68", // danger
  "#929ba5", // neutral
  "#302b35", // foreground
];

export const EXPENSE_COLOR = "#e18f87";
export const INVESTMENT_COLOR = "#9685bb";
export const NEUTRAL_COLOR = "#cec5d3"; // border.strong — previous-year series
export const GRID_COLOR = "#e9e3eb"; // border

/** Category color when set, otherwise a stable palette color by index. */
export function colorFor(explicit: string | null | undefined, index: number): string {
  return explicit ?? CHART_COLORS[index % CHART_COLORS.length];
}
