"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn, formatMoney } from "@/lib/utils";
import type { TaxBreakdown } from "@/lib/tax/types";
import { TaxBreakdownDetails } from "./tax-breakdown-details";

export function IncomeLineRow({
  name,
  amount,
  badge,
  note,
  muted,
  actions,
  breakdown,
}: {
  name: string;
  amount?: number;
  badge?: ReactNode;
  note?: string | null;
  muted?: boolean;
  actions?: ReactNode;
  breakdown?: TaxBreakdown | null;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col px-4 py-3">
      <div
        className={cn("flex items-center gap-3", {
          "opacity-60": muted,
          "cursor-pointer": !!breakdown,
        })}
        onClick={breakdown ? () => setExpanded((was) => !was) : undefined}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{name}</span>
            {badge}
            {breakdown && (
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  { "rotate-180": expanded },
                )}
              />
            )}
          </div>
          {note && (
            <span className="truncate text-sm text-muted-foreground">
              {note}
            </span>
          )}
        </div>
        {amount !== undefined && (
          <span className="flex shrink-0 flex-col items-end leading-tight">
            <span className="font-semibold tnum">{formatMoney(amount)}</span>
            {breakdown && (
              <span className="text-xs text-muted-foreground tnum">
                {t.income.grossSub.replace(
                  "{amount}",
                  formatMoney(breakdown.gross),
                )}
              </span>
            )}
          </span>
        )}
        {actions && (
          <div
            className="shrink-0"
            onClick={(event) => event.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>
      {breakdown && (
        <div
          className={cn(
            "grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-in-out",
            { "grid-rows-[1fr]": expanded },
          )}
        >
          <div className="overflow-hidden">
            <div className="pt-2">
              <TaxBreakdownDetails breakdown={breakdown} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
