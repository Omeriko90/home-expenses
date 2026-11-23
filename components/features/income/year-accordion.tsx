"use client";

import { Pencil } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import type { ResolvedMonthIncome } from "@/lib/income-resolve";
import { Accordion } from "@/components/ui/accordion/Accordion";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/shared/icon-button";
import {
  isWithinLifetime,
  type IncomeEntryData,
  type IncomeSourceData,
} from "./types";

export function YearAccordion({
  sources,
  entries,
  months,
  year,
  onEditCell,
}: {
  sources: IncomeSourceData[];
  entries: IncomeEntryData[];
  months: ResolvedMonthIncome[];
  year: number;
  onEditCell: (sourceId: string, month: number) => void;
}) {
  const { t } = useI18n();

  const items = sources.map((source) => {
    const rowTotal = months.reduce(
      (sum, m) =>
        sum + (m.sources.find((s) => s.sourceId === source.id)?.amount ?? 0),
      0,
    );
    return {
      value: source.id,
      trigger: (
        <span className="flex w-full items-center justify-between gap-2 pe-2">
          <span className="font-medium">{source.name}</span>
          <span className="tnum text-muted-foreground">
            {formatMoney(rowTotal)}
          </span>
        </span>
      ),
      content: (
        <div className="divide-y divide-border">
          {months.map((m, i) => {
            const line = m.sources.find((s) => s.sourceId === source.id);
            const editable = isWithinLifetime(source, entries, year, i + 1);
            return (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <span className="flex-1 text-muted-foreground">
                  {t.months[i]}
                </span>
                <span className="tnum">
                  {editable && line ? formatMoney(line.amount) : "—"}
                </span>
                {editable && (
                  <IconButton
                    label={t.income.editMonth}
                    onClick={() => onEditCell(source.id, i + 1)}
                  >
                    <Pencil />
                  </IconButton>
                )}
              </div>
            );
          })}
        </div>
      ),
    };
  });

  return (
    <Card className="px-4 md:hidden">
      <Accordion items={items} />
    </Card>
  );
}
