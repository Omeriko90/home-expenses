"use client";

import { Banknote, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { ResolvedMonthIncome } from "@/lib/income-resolve";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { IncomeLineRow } from "./income-line-row";
import { SourceMenu } from "./source-menu";
import { OneTimeMenu } from "./one-time-menu";
import type { IncomeEntryData } from "./types";

export function MonthIncomeList({
  resolved,
  entries,
  onAdd,
  onEditSource,
  onEnd,
  onDeleteSource,
  onEditOneTime,
  onDeleteOneTime,
}: {
  resolved: ResolvedMonthIncome;
  entries: IncomeEntryData[];
  onAdd: () => void;
  onEditSource: (sourceId: string) => void;
  onEnd: (sourceId: string) => void;
  onDeleteSource: (sourceId: string) => void;
  onEditOneTime: (entry: IncomeEntryData) => void;
  onDeleteOneTime: (entry: IncomeEntryData) => void;
}) {
  const { t } = useI18n();
  const breakdownFor = (entryId: string) =>
    entries.find((entry) => entry.id === entryId)?.taxBreakdown ?? null;

  if (resolved.sources.length === 0 && resolved.oneTimes.length === 0) {
    return (
      <EmptyState
        icon={<Banknote />}
        title={t.income.emptyMonth}
        action={
          <Button onClick={onAdd}>
            <Plus /> {t.income.add}
          </Button>
        }
      />
    );
  }

  return (
    <Card className="divide-y divide-border overflow-hidden">
      {resolved.sources.map((line) => (
        <IncomeLineRow
          key={line.sourceId}
          name={line.name}
          amount={line.amount}
          note={line.note}
          breakdown={breakdownFor(line.entryId)}
          badge={
            line.isOverride ? (
              <Badge variant="info">{t.income.overrideBadge}</Badge>
            ) : undefined
          }
          actions={
            <SourceMenu
              ended={false}
              onEdit={() => onEditSource(line.sourceId)}
              onEnd={() => onEnd(line.sourceId)}
              onReactivate={() => undefined}
              onDelete={() => onDeleteSource(line.sourceId)}
            />
          }
        />
      ))}
      {resolved.oneTimes.map((entry) => (
        <IncomeLineRow
          key={entry.id}
          name={entry.name ?? ""}
          amount={entry.amount}
          note={entry.note}
          breakdown={entry.taxBreakdown}
          badge={<Badge variant="primary">{t.income.oneTimeBadge}</Badge>}
          actions={
            <OneTimeMenu
              onEdit={() => onEditOneTime(entry)}
              onDelete={() => onDeleteOneTime(entry)}
            />
          }
        />
      ))}
    </Card>
  );
}
