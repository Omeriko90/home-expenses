"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import { calcBonusNet, calcNetSalary } from "@/lib/tax/calc";
import type { TaxParams } from "@/lib/tax/types";
import { TaxBreakdownLines } from "./tax-breakdown-lines";
import {
  IncomeType,
  effectiveAmountInputFor,
  type IncomeEntryData,
  type IncomeSourceData,
} from "./types";

function percentToFraction(percent: number | undefined): number | null {
  if (!percent || percent <= 0) return null;
  return percent / 100;
}

function computePreviewBreakdown({
  type,
  amount,
  year,
  month,
  creditPoints,
  pensionPercent,
  hishtalmutPercent,
  hishtalmutCapped,
  linkedSourceId,
  sources,
  entries,
}: {
  type: string;
  amount: number;
  year: number;
  month: number;
  creditPoints: number | undefined;
  pensionPercent: number | undefined;
  hishtalmutPercent: number | undefined;
  hishtalmutCapped: boolean | undefined;
  linkedSourceId: string | undefined;
  sources: IncomeSourceData[];
  entries: IncomeEntryData[];
}) {
  if (type !== IncomeType.OneTime) {
    return calcNetSalary(
      amount,
      {
        creditPoints: typeof creditPoints === "number" ? creditPoints : 2.25,
        pensionRate: percentToFraction(pensionPercent),
        hishtalmutRate: percentToFraction(hishtalmutPercent),
        hishtalmutCapped: hishtalmutCapped !== false,
      },
      year,
    );
  }
  const linked = linkedSourceId
    ? (sources.find((source) => source.id === linkedSourceId) ?? null)
    : null;
  const params: TaxParams = linked
    ? {
        creditPoints: linked.creditPoints,
        pensionRate: linked.pensionRate,
        hishtalmutRate: linked.hishtalmutRate,
        hishtalmutCapped: linked.hishtalmutCapped,
      }
    : {
        creditPoints: 0,
        pensionRate: null,
        hishtalmutRate: null,
        hishtalmutCapped: true,
      };
  const baseGross = linked
    ? (effectiveAmountInputFor(sources, entries, linked.id, year, month) ?? 0)
    : 0;
  return calcBonusNet(baseGross, amount, params, year);
}

export function TaxBreakdownPreview({
  sources,
  entries,
}: {
  sources: IncomeSourceData[];
  entries: IncomeEntryData[];
}) {
  const { t } = useI18n();
  const { control } = useFormContext();
  const type = useWatch({ control, name: "type" });
  const amount = useWatch({ control, name: "amount" });
  const start = useWatch({ control, name: "start" });
  const creditPoints = useWatch({ control, name: "creditPoints" });
  const pensionPercent = useWatch({ control, name: "pensionPercent" });
  const hishtalmutPercent = useWatch({ control, name: "hishtalmutPercent" });
  const hishtalmutCapped = useWatch({ control, name: "hishtalmutCapped" });
  const linkedSourceId = useWatch({ control, name: "linkedSourceId" });

  const year: number = start?.year ?? new Date().getFullYear();
  const month: number = start?.month ?? new Date().getMonth() + 1;

  const breakdown = computePreviewBreakdown({
    type,
    amount,
    year,
    month,
    creditPoints,
    pensionPercent,
    hishtalmutPercent,
    hishtalmutCapped,
    linkedSourceId,
    sources,
    entries,
  });

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface-muted/40 p-3">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">{t.income.estimatedNet}</span>
        <span className="text-base font-semibold tnum">
          {formatMoney(breakdown.net, { decimals: true })}
        </span>
      </div>
      <TaxBreakdownLines breakdown={breakdown} />
    </div>
  );
}
