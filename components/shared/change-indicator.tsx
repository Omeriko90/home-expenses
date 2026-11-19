import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn, formatMoney, formatPercent } from "@/lib/utils";

export function ChangeIndicator({
  amount,
  pct,
  mode,
  invert = false,
}: {
  amount: number;
  pct: number | null;
  mode: "money" | "percent";
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
