"use client";

import type { ReactNode } from "react";
import { cn, formatMoney } from "@/lib/utils";

export function IncomeLineRow({
  name,
  amount,
  badge,
  note,
  muted,
  actions,
}: {
  name: string;
  amount?: number;
  badge?: ReactNode;
  note?: string | null;
  muted?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div
      className={cn("flex items-center gap-3 px-4 py-3", {
        "opacity-60": muted,
      })}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{name}</span>
          {badge}
        </div>
        {note && (
          <span className="truncate text-sm text-muted-foreground">{note}</span>
        )}
      </div>
      {amount !== undefined && (
        <span className="shrink-0 font-semibold tnum">
          {formatMoney(amount)}
        </span>
      )}
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
