"use client";

import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import type { Verdict, VerdictSource } from "./types";

export function VerdictBadge({
  verdict,
  source = "capacity",
}: {
  verdict: Verdict;
  source?: VerdictSource;
}) {
  const { t } = useI18n();

  if (verdict === "unknown") {
    return (
      <Tooltip content={t.planning.verdictUnknownHint}>
        <Badge variant="default">{t.planning.verdictUnknown}</Badge>
      </Tooltip>
    );
  }

  const variant = { fits: "success", tight: "warning", over: "danger" } as const;
  const label =
    source === "budget"
      ? {
          fits: t.planning.verdictWithinBudget,
          tight: t.planning.verdictNearBudget,
          over: t.planning.verdictOverBudget,
        }
      : {
          fits: t.planning.verdictFits,
          tight: t.planning.verdictTight,
          over: t.planning.verdictOver,
        };
  return <Badge variant={variant[verdict]}>{label[verdict]}</Badge>;
}
