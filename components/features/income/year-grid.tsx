"use client";

import { useI18n } from "@/lib/i18n/context";
import { cn, formatMoney } from "@/lib/utils";
import type { ResolvedMonthIncome } from "@/lib/income-resolve";
import { Card } from "@/components/ui/card";
import {
  isWithinLifetime,
  overrideFor,
  type IncomeEntryData,
  type IncomeSourceData,
} from "./types";

export function YearGrid({
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

  const oneTimeTotals = months.map((m) =>
    m.oneTimes.reduce((sum, e) => sum + e.amount, 0),
  );
  const hasOneTimes = oneTimeTotals.some((v) => v > 0);

  return (
    <Card className="hidden overflow-hidden md:block">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/50 text-muted-foreground">
              <th className="px-4 py-2 text-start font-medium">
                {t.common.name}
              </th>
              {t.months.map((m) => (
                <th key={m} className="px-2 py-2 text-end font-medium">
                  {m}
                </th>
              ))}
              <th className="px-4 py-2 text-end font-medium">
                {t.common.total}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sources.map((source) => {
              const cells = months.map((m, i) => {
                const line = m.sources.find((s) => s.sourceId === source.id);
                const editable = isWithinLifetime(
                  source,
                  entries,
                  year,
                  i + 1,
                );
                return { line, editable };
              });
              const rowTotal = cells.reduce(
                (sum, c) => sum + (c.line?.amount ?? 0),
                0,
              );
              return (
                <tr key={source.id}>
                  <td className="whitespace-nowrap px-4 py-2 font-medium">
                    {source.name}
                  </td>
                  {cells.map(({ line, editable }, i) => (
                    <td key={i} className="px-1 py-1 text-end">
                      {editable ? (
                        <button
                          type="button"
                          onClick={() => onEditCell(source.id, i + 1)}
                          className={cn(
                            "w-full rounded-md px-1 py-1 text-end tnum transition-colors hover:bg-surface-muted",
                            line?.isOverride && "font-semibold text-info",
                            overrideFor(entries, source.id, year, i + 1) &&
                              !line?.isOverride &&
                              "text-info",
                          )}
                        >
                          {line ? formatMoney(line.amount) : "—"}
                        </button>
                      ) : (
                        <span className="block px-1 py-1 text-muted-foreground">
                          —
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-2 text-end font-semibold tnum">
                    {formatMoney(rowTotal)}
                  </td>
                </tr>
              );
            })}
            {hasOneTimes && (
              <tr>
                <td className="whitespace-nowrap px-4 py-2 font-medium text-muted-foreground">
                  {t.income.oneTimes}
                </td>
                {oneTimeTotals.map((v, i) => (
                  <td key={i} className="px-2 py-2 text-end tnum">
                    {v > 0 ? formatMoney(v) : "—"}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4 py-2 text-end font-semibold tnum">
                  {formatMoney(oneTimeTotals.reduce((a, b) => a + b, 0))}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-surface-muted/50 font-semibold">
              <td className="px-4 py-2">{t.common.total}</td>
              {months.map((m, i) => (
                <td key={i} className="px-2 py-2 text-end tnum">
                  {m.total > 0 ? formatMoney(m.total) : "—"}
                </td>
              ))}
              <td className="px-4 py-2 text-end tnum">
                {formatMoney(months.reduce((sum, m) => sum + m.total, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
