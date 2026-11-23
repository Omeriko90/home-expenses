"use client";

import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/shared/section";
import { IncomeLineRow } from "./income-line-row";
import { SourceMenu } from "./source-menu";
import {
  sourceStatusForMonth,
  type IncomeEntryData,
  type IncomeSourceData,
} from "./types";

export function InactiveSources({
  sources,
  entries,
  year,
  month,
  onEditSource,
  onEnd,
  onReactivate,
  onDeleteSource,
}: {
  sources: IncomeSourceData[];
  entries: IncomeEntryData[];
  year: number;
  month: number;
  onEditSource: (sourceId: string) => void;
  onEnd: (sourceId: string) => void;
  onReactivate: (sourceId: string) => void;
  onDeleteSource: (sourceId: string) => void;
}) {
  const { t } = useI18n();

  const inactive = sources
    .map((source) => ({
      source,
      status: sourceStatusForMonth(source, entries, year, month),
    }))
    .filter(({ status }) => status.kind !== "active");

  if (inactive.length === 0) return null;

  return (
    <Section title={t.income.inactive}>
      <Card className="divide-y divide-border overflow-hidden">
        {inactive.map(({ source, status }) => (
          <IncomeLineRow
            key={source.id}
            name={source.name}
            muted
            badge={
              status.kind === "ended" ? (
                <Badge>
                  {t.income.endedAt.replace(
                    "{m}",
                    `${t.months[status.endMonth - 1]} ${status.endYear}`,
                  )}
                </Badge>
              ) : status.kind === "notStarted" ? (
                <Badge variant="info">
                  {t.income.startsAt.replace(
                    "{m}",
                    `${t.months[status.startMonth - 1]} ${status.startYear}`,
                  )}
                </Badge>
              ) : undefined
            }
            actions={
              <SourceMenu
                ended={status.kind === "ended"}
                onEdit={() => onEditSource(source.id)}
                onEnd={() => onEnd(source.id)}
                onReactivate={() => onReactivate(source.id)}
                onDelete={() => onDeleteSource(source.id)}
              />
            }
          />
        ))}
      </Card>
    </Section>
  );
}
