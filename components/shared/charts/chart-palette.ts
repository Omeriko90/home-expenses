import { colors } from "@/lib/design-tokens";

export const CHART_COLORS = [
  colors.primary.DEFAULT,
  colors.secondary.DEFAULT,
  colors.accent.DEFAULT,
  colors.income.DEFAULT,
  colors.investment.DEFAULT,
  colors.expense.DEFAULT,
  colors.info.DEFAULT,
  colors.success.DEFAULT,
  colors.warning.DEFAULT,
  colors.danger.DEFAULT,
  colors.neutral.DEFAULT,
  colors.foreground,
];

export const EXPENSE_COLOR = colors.expense.DEFAULT;
export const INVESTMENT_COLOR = colors.investment.DEFAULT;
export const NEUTRAL_COLOR = colors.border.strong;
export const GRID_COLOR = colors.border.DEFAULT;
export const DISABLED_COLOR = colors.disabled;

export function colorFor(explicit: string | null | undefined, index: number): string {
  return explicit ?? CHART_COLORS[index % CHART_COLORS.length];
}
