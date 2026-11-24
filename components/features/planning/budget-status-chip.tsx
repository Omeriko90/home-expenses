"use client";

import { Check, CircleAlert, TriangleAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import type { Verdict } from "./types";

const VARIANT = {
  fits: "success",
  tight: "warning",
  over: "danger",
} as const;

const ICON = {
  fits: Check,
  tight: CircleAlert,
  over: TriangleAlert,
};

export function BudgetStatusChip({ verdict }: { verdict: Verdict }) {
  const { t } = useI18n();
  if (verdict === "unknown") return null;
  const Icon = ICON[verdict];
  return (
    <Badge
      variant={VARIANT[verdict]}
      className="px-1.5"
      aria-label={t.planning.budgetImpact}
    >
      <Icon className="size-3 shrink-0" />
    </Badge>
  );
}
