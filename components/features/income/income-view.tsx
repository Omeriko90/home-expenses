"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import { resolveMonthIncome } from "@/lib/income-resolve";
import {
  deleteIncomeEntry,
  deleteIncomeSource,
  reactivateIncomeSource,
} from "@/app/actions/income";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { YearPicker } from "@/components/shared/year-picker";
import { Button } from "@/components/ui/button";
import { MonthIncomeList } from "./month-income-list";
import { InactiveSources } from "./inactive-sources";
import { YearGrid } from "./year-grid";
import { YearAccordion } from "./year-accordion";
import { IncomeFormDialog } from "./income-form-dialog";
import { EditSourceDialog } from "./edit-source-dialog";
import { OverrideDialog } from "./override-dialog";
import { EndSourceDialog } from "./end-source-dialog";
import { ViewToggle } from "./view-toggle";
import {
  overrideFor,
  View,
  type IncomeEntryData,
  type IncomeSourceData,
  type ViewMode,
} from "./types";

export function IncomeView({
  year,
  month,
  view,
  sources,
  entries,
  expenseTotals,
}: {
  year: number;
  month: number;
  view: ViewMode;
  sources: IncomeSourceData[];
  entries: IncomeEntryData[];
  expenseTotals: number[];
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  const [addOpen, setAddOpen] = useState(false);
  const [editingOneTime, setEditingOneTime] =
    useState<IncomeEntryData | null>(null);
  const [editFor, setEditFor] = useState<IncomeSourceData | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<{
    source: IncomeSourceData;
    month: number;
  } | null>(null);
  const [endFor, setEndFor] = useState<IncomeSourceData | null>(null);
  const [toDelete, setToDelete] = useState<{
    kind: "source" | "entry";
    id: string;
    title: string;
  } | null>(null);

  const resolved = useMemo(
    () => resolveMonthIncome(sources, entries, year, month),
    [sources, entries, year, month],
  );
  const grid = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        resolveMonthIncome(sources, entries, year, i + 1),
      ),
    [sources, entries, year],
  );

  const monthIncome = resolved.total;
  const monthExpenses = expenseTotals[month - 1] ?? 0;
  const yearIncome = grid.reduce((sum, m) => sum + m.total, 0);
  const yearExpenses = expenseTotals.reduce((a, b) => a + b, 0);
  const income = view === View.Month ? monthIncome : yearIncome;
  const expenses = view === View.Month ? monthExpenses : yearExpenses;

  const overrideMonthResolved =
    overrideTarget &&
    resolveMonthIncome(sources, entries, year, overrideTarget.month);

  const sourceById = (id: string) => sources.find((s) => s.id === id) ?? null;

  function handleEditCell(sourceId: string, m: number) {
    const source = sourceById(sourceId);
    if (source) setOverrideTarget({ source, month: m });
  }

  function handleEditSource(sourceId: string) {
    setEditFor(sourceById(sourceId));
  }

  function handleDeleteSourceRequest(sourceId: string) {
    const source = sourceById(sourceId);
    if (source)
      setToDelete({ kind: "source", id: source.id, title: source.name });
  }

  function handleReactivate(sourceId: string) {
    startTransition(async () => {
      await reactivateIncomeSource(sourceId);
      toast.success(t.common.save);
    });
  }

  function handleDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      if (toDelete.kind === "source") await deleteIncomeSource(toDelete.id);
      else await deleteIncomeEntry(toDelete.id);
      toast.success(t.common.delete);
      setToDelete(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <div className="flex w-full flex-wrap items-center gap-2">
            <ViewToggle view={view} />
            {view === View.Month ? (
              <MonthYearPicker year={year} month={month} />
            ) : (
              <YearPicker year={year} />
            )}
            <div className="ms-auto">
              <Button onClick={() => setAddOpen(true)}>
                <Plus /> {t.income.add}
              </Button>
            </div>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t.income.income}
          value={formatMoney(income)}
          accent="income"
        />
        <StatCard
          label={t.income.expenses}
          value={formatMoney(expenses)}
          accent="expense"
        />
        <StatCard
          label={t.income.leftOver}
          value={formatMoney(income - expenses)}
          accent="primary"
        />
      </div>

      {view === View.Month ? (
        <>
          <MonthIncomeList
            resolved={resolved}
            onAdd={() => setAddOpen(true)}
            onEditSource={handleEditSource}
            onEnd={(id) => setEndFor(sourceById(id))}
            onDeleteSource={handleDeleteSourceRequest}
            onEditOneTime={setEditingOneTime}
            onDeleteOneTime={(entry) =>
              setToDelete({
                kind: "entry",
                id: entry.id,
                title: entry.name ?? "",
              })
            }
          />
          <InactiveSources
            sources={sources}
            entries={entries}
            year={year}
            month={month}
            onEditSource={handleEditSource}
            onEnd={(id) => setEndFor(sourceById(id))}
            onReactivate={handleReactivate}
            onDeleteSource={handleDeleteSourceRequest}
          />
        </>
      ) : (
        <>
          <YearGrid
            sources={sources}
            entries={entries}
            months={grid}
            year={year}
            onEditCell={handleEditCell}
          />
          <YearAccordion
            sources={sources}
            entries={entries}
            months={grid}
            year={year}
            onEditCell={handleEditCell}
          />
        </>
      )}

      {addOpen && (
        <IncomeFormDialog
          onClose={() => setAddOpen(false)}
          defaultYear={year}
          defaultMonth={month}
        />
      )}
      {editingOneTime && (
        <IncomeFormDialog
          onClose={() => setEditingOneTime(null)}
          defaultYear={year}
          defaultMonth={month}
          editingOneTime={editingOneTime}
        />
      )}
      {editFor && (
        <EditSourceDialog
          source={editFor}
          currentAmount={
            resolved.sources.find((s) => s.sourceId === editFor.id)?.amount ??
            null
          }
          year={year}
          month={month}
          onClose={() => setEditFor(null)}
        />
      )}
      {overrideTarget && (
        <OverrideDialog
          source={overrideTarget.source}
          year={year}
          month={overrideTarget.month}
          currentAmount={
            overrideMonthResolved?.sources.find(
              (s) => s.sourceId === overrideTarget.source.id,
            )?.amount ?? null
          }
          existingOverride={overrideFor(
            entries,
            overrideTarget.source.id,
            year,
            overrideTarget.month,
          )}
          onClose={() => setOverrideTarget(null)}
        />
      )}
      {endFor && (
        <EndSourceDialog
          source={endFor}
          defaultYear={year}
          defaultMonth={month}
          onClose={() => setEndFor(null)}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          open
          onClose={() => setToDelete(null)}
          title={
            toDelete.kind === "source"
              ? t.income.deleteSourceConfirm
              : t.income.deleteEntryConfirm
          }
          description={toDelete.title}
          onConfirm={handleDelete}
          loading={pending}
          destructive
        />
      )}
    </div>
  );
}
