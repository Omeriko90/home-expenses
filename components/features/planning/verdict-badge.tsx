"use client";

import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import type { Verdict } from "./types";

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const { t } = useI18n();

  if (verdict === "unknown") {
    return (
      <Tooltip content={t.planning.verdictUnknownHint}>
        <Badge variant="default">{t.planning.verdictUnknown}</Badge>
      </Tooltip>
    );
  }

  const variant = { fits: "success", tight: "warning", over: "danger" } as const;
  const label = {
    fits: t.planning.verdictFits,
    tight: t.planning.verdictTight,
    over: t.planning.verdictOver,
  };
  return <Badge variant={variant[verdict]}>{label[verdict]}</Badge>;
}
