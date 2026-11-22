"use client";

import { Banknote, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { ResolvedMonthIncome } from "@/lib/income-resolve";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { EditDeleteActions } from "@/components/shared/edit-delete-actions";
import { IncomeLineRow } from "./income-line-row";
import { SourceMenu } from "./source-menu";
import type { IncomeEntryData } from "./types";

export function MonthIncomeList({
  resolved,
  onAdd,
  onEditSource,
  onEnd,
  onDeleteSource,
  onEditOneTime,
  onDeleteOneTime,
}: {
  resolved: ResolvedMonthIncome;
  onAdd: () => void;
  onEditSource: (sourceId: string) => void;
  onEnd: (sourceId: string) => void;
  onDeleteSource: (sourceId: string) => void;
  onEditOneTime: (entry: IncomeEntryData) => void;
  onDeleteOneTime: (entry: IncomeEntryData) => void;
}) {
  const { t } = useI18n();

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
          badge={<Badge variant="primary">{t.income.oneTimeBadge}</Badge>}
          actions={
            <EditDeleteActions
              onEdit={() => onEditOneTime(entry)}
              onDelete={() => onDeleteOneTime(entry)}
            />
          }
        />
      ))}
    </Card>
  );
}
