"use client";

import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import type { TaxBreakdown } from "@/lib/tax/types";

export function TaxBreakdownLines({ breakdown }: { breakdown: TaxBreakdown }) {
  const { t } = useI18n();
  const lines: [string, number][] = [
    [t.income.incomeTax, breakdown.incomeTax],
    [t.income.surtax, breakdown.surtax],
    [t.income.bituachLeumi, breakdown.bituachLeumi],
    [t.income.healthTax, breakdown.healthTax],
    [t.income.pension, breakdown.pension],
    [t.income.hishtalmut, breakdown.hishtalmut],
  ];
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {lines
        .filter(([, value]) => value > 0)
        .map(([label, value]) => (
          <li key={label} className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="tnum">−{formatMoney(value, { decimals: true })}</span>
          </li>
        ))}
    </ul>
  );
}
