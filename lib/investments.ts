import type { PortfolioSummary } from "@/lib/summary";

type Holding = PortfolioSummary["holdings"][number];

export type HoldingTypeGroup = {
  type: string;
  items: Holding[];
  sum: number;
};

export function groupHoldingsByType(holdings: Holding[]): HoldingTypeGroup[] {
  const byType = new Map<string, Holding[]>();
  for (const h of holdings) {
    const key = h.type || "";
    byType.set(key, [...(byType.get(key) ?? []), h]);
  }
  return [...byType.entries()]
    .map(([type, items]) => ({
      type,
      items,
      sum: items.reduce((acc, h) => acc + h.value, 0),
    }))
    .sort((a, b) => {
      if (!a.type) return 1;
      if (!b.type) return -1;
      return b.sum - a.sum;
    });
}
