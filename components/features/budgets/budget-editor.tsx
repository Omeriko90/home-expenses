"use client";

import * as React from "react";
import { Copy, Info } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import {
  upsertBudget,
  copyBudgetsFromPreviousYear,
} from "@/app/actions/budgets";
import { PageHeader } from "@/components/shared/page-header";
import { YearSelect } from "@/components/shared/year-select";
import { MoneyInput } from "@/components/shared/money-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Row = { categoryId: string; name: string; monthly: number };

export function BudgetEditor({
  year,
  years,
  rows,
}: {
  year: number;
  years: number[];
  rows: Row[];
}) {
  const { t } = useI18n();
  const [values, setValues] = React.useState<Record<string, number | "">>(() =>
    Object.fromEntries(rows.map((r) => [r.categoryId, r.monthly || ""])),
  );
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setValues(Object.fromEntries(rows.map((r) => [r.categoryId, r.monthly || ""])));
  }, [rows]);

  const totalMonthly = Object.values(values).reduce<number>(
    (sum, v) => sum + (typeof v === "number" ? v : 0),
    0,
  );

  function save(categoryId: string, value: number | "") {
    const monthlyAmount = typeof value === "number" ? value : 0;
    startTransition(async () => {
      await upsertBudget({ categoryId, year, monthlyAmount });
    });
  }

  function copyPrev() {
    startTransition(async () => {
      const res = await copyBudgetsFromPreviousYear(year);
      toast.success(`${t.budgets.copyPrev} (${res.copied})`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={copyPrev} disabled={pending}>
              <Copy /> {t.budgets.copyPrev}
            </Button>
            <YearSelect year={year} years={years} />
          </div>
        }
      />

      <Card className="overflow-hidden">
        <Table containerClassName="max-h-[calc(100dvh-14rem)] overflow-y-auto">
          <TableHeader>
            <TableRow>
              <TableHead>{t.common.category}</TableHead>
              <TableHead className="w-40">{t.budgets.monthlyBudget}</TableHead>
              <TableHead className="w-40 text-end">
                <span className="inline-flex items-center gap-1">
                  {t.budgets.yearlyBudget}
                  <Tooltip content={t.budgets.subtitle}>
                    <button
                      type="button"
                      aria-label={t.budgets.subtitle}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Info className="size-3.5" />
                    </button>
                  </Tooltip>
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const v = values[r.categoryId];
              const yearly = (typeof v === "number" ? v : 0) * 12;
              return (
                <TableRow key={r.categoryId}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <MoneyInput
                      value={v ?? ""}
                      onValueChange={(val) =>
                        setValues((prev) => ({ ...prev, [r.categoryId]: val }))
                      }
                      onBlur={() => save(r.categoryId, v ?? "")}
                    />
                  </TableCell>
                  <TableCell className="text-end tnum text-muted-foreground">
                    {formatMoney(yearly)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t border-border bg-surface-muted/50 px-4 py-3 text-sm font-semibold">
          <span>{t.common.total}</span>
          <div className="flex gap-8 tnum">
            <span>
              {t.budgets.totalMonthly}: {formatMoney(totalMonthly)}
            </span>
            <span>
              {t.budgets.totalYearly}: {formatMoney(totalMonthly * 12)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
