"use client";

import { Check, CircleAlert, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Verdict } from "./types";

const VARIANT = {
  fits: "success",
  tight: "warning",
  over: "danger",
  unknown: "default",
} as const;

const ICON = {
  fits: Check,
  tight: CircleAlert,
  over: TriangleAlert,
  unknown: null,
};

export function CategoryBudgetBadge({
  name,
  verdict,
}: {
  name: string;
  verdict: Verdict;
}) {
  const Icon = ICON[verdict];
  return (
    <Badge variant={VARIANT[verdict]}>
      {Icon && <Icon className="size-3 shrink-0" />}
      {name}
    </Badge>
  );
}
