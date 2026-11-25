"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import { calcBonusNet, calcNetSalary } from "@/lib/tax/calc";
import type { TaxParams } from "@/lib/tax/types";
import { TaxBreakdownLines } from "./tax-breakdown-lines";
import {
  AmountTypes,
  IncomeType,
  governingAmountInputFor,
  type IncomeEntryData,
  type IncomeSourceData,
} from "./types";

function percentToFraction(percent: number | undefined): number | null {
  if (!percent || percent <= 0) return null;
  return percent / 100;
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
  const amountType = useWatch({ control, name: "amountType" });
  const amount = useWatch({ control, name: "amount" });
  const start = useWatch({ control, name: "start" });
  const creditPoints = useWatch({ control, name: "creditPoints" });
  const pensionPercent = useWatch({ control, name: "pensionPercent" });
  const hishtalmutPercent = useWatch({ control, name: "hishtalmutPercent" });
  const linkedSourceId = useWatch({ control, name: "linkedSourceId" });

  if (amountType !== AmountTypes.Gross) return null;
  if (typeof amount !== "number" || amount <= 0) return null;

  const year: number = start?.year ?? new Date().getFullYear();
  const month: number = start?.month ?? new Date().getMonth() + 1;

  let breakdown;
  if (type === IncomeType.OneTime) {
    const linked = linkedSourceId
      ? (sources.find((source) => source.id === linkedSourceId) ?? null)
      : null;
    const params: TaxParams = linked
      ? {
          creditPoints: linked.creditPoints,
          pensionRate: linked.pensionRate,
          hishtalmutRate: linked.hishtalmutRate,
        }
      : { creditPoints: 0, pensionRate: null, hishtalmutRate: null };
    const baseGross = linked
      ? (governingAmountInputFor(sources, entries, linked.id, year, month) ?? 0)
      : 0;
    breakdown = calcBonusNet(baseGross, amount, params, year);
  } else {
    breakdown = calcNetSalary(
      amount,
      {
        creditPoints: typeof creditPoints === "number" ? creditPoints : 2.25,
        pensionRate: percentToFraction(pensionPercent),
        hishtalmutRate: percentToFraction(hishtalmutPercent),
      },
      year,
    );
  }

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
