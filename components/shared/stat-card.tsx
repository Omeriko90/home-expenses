import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatMoney, formatPercent } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent?: "investment" | "expense" | "income" | "primary";
}) {
  const bar =
    accent === "investment"
      ? "bg-investment"
      : accent === "expense"
        ? "bg-expense"
        : accent === "income"
          ? "bg-income"
          : "bg-primary";
  return (
    <Card className="relative overflow-hidden p-5">
      <div className={cn("absolute inset-y-0 start-0 w-1", bar)} />
      <div className="flex flex-col gap-1 ps-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold tnum tracking-tight">{value}</span>
        {sub && <div className="text-sm">{sub}</div>}
      </div>
    </Card>
  );
}

/** Colored +/- delta. `mode` selects money vs percent display. */
export function ChangeIndicator({
  amount,
  pct,
  mode,
  invert = false,
}: {
  amount: number;
  pct: number | null;
  mode: "money" | "percent";
  /** invert: treat increase as negative (e.g. rising expenses are "bad"). */
  invert?: boolean;
}) {
  if (amount === 0) return <span className="text-muted-foreground">—</span>;
  const up = amount > 0;
  const good = invert ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 tnum font-medium",
        good ? "text-success" : "text-danger",
      )}
    >
      <Icon className="size-4" />
      {mode === "money"
        ? formatMoney(Math.abs(amount))
        : pct === null
          ? "—"
          : formatPercent(Math.abs(pct))}
    </span>
  );
}
