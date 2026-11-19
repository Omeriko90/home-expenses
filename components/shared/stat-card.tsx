import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: React.ReactNode;
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
