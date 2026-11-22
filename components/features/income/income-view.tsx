"use client";

import * as React from "react";
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
import { YearSelect } from "@/components/shared/year-select";
import { MonthSelect } from "@/components/shared/month-select";
import { Button } from "@/components/ui/button";
import { MonthIncomeList } from "./month-income-list";
import { InactiveSources } from "./inactive-sources";
import { YearGrid } from "./year-grid";
import { YearAccordion } from "./year-accordion";
import { IncomeFormDialog } from "./income-form-dialog";
import { RaiseDialog } from "./raise-dialog";
import { OverrideDialog } from "./override-dialog";
import { RenameSourceDialog } from "./rename-source-dialog";
import { EndSourceDialog } from "./end-source-dialog";
import { ViewToggle } from "./view-toggle";
import { overrideFor, type IncomeEntryData, type IncomeSourceData } from "./types";

export function IncomeView({
  years,
  year,
  month,
  view,
  sources,
  entries,
  expenseTotals,
}: {
  years: number[];
  year: number;
  month: number;
  view: "month" | "year";
  sources: IncomeSourceData[];
  entries: IncomeEntryData[];
  expenseTotals: number[];
}) {
  const { t } = useI18n();
  const [pending, startTransition] = React.useTransition();

  const [addOpen, setAddOpen] = React.useState(false);
  const [editingOneTime, setEditingOneTime] =
    React.useState<IncomeEntryData | null>(null);
  const [raiseFor, setRaiseFor] = React.useState<IncomeSourceData | null>(null);
  const [overrideTarget, setOverrideTarget] = React.useState<{
    source: IncomeSourceData;
    month: number;
  } | null>(null);
  const [renameFor, setRenameFor] = React.useState<IncomeSourceData | null>(
    null,
  );
  const [endFor, setEndFor] = React.useState<IncomeSourceData | null>(null);
  const [toDelete, setToDelete] = React.useState<{
    kind: "source" | "entry";
    id: string;
    title: string;
  } | null>(null);

  const resolved = React.useMemo(
    () => resolveMonthIncome(sources, entries, year, month),
    [sources, entries, year, month],
  );
  const grid = React.useMemo(
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
  const income = view === "month" ? monthIncome : yearIncome;
  const expenses = view === "month" ? monthExpenses : yearExpenses;

  const sourceById = (id: string) => sources.find((s) => s.id === id) ?? null;

  function openOverride(sourceId: string, m: number) {
    const source = sourceById(sourceId);
    if (source) setOverrideTarget({ source, month: m });
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

  const overrideMonthResolved =
    overrideTarget &&
    resolveMonthIncome(sources, entries, year, overrideTarget.month);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <div className="flex w-full flex-wrap items-center gap-2">
            <ViewToggle view={view} />
            <YearSelect year={year} years={years} />
            {view === "month" && <MonthSelect month={month} />}
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

      {view === "month" ? (
        <>
          <MonthIncomeList
            resolved={resolved}
            onEditMonth={(id) => openOverride(id, month)}
            onRaise={(id) => setRaiseFor(sourceById(id))}
            onRename={(id) => setRenameFor(sourceById(id))}
            onEnd={(id) => setEndFor(sourceById(id))}
            onDeleteSource={(id) => {
              const s = sourceById(id);
              if (s)
                setToDelete({ kind: "source", id: s.id, title: s.name });
            }}
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
            onRaise={(id) => setRaiseFor(sourceById(id))}
            onRename={(id) => setRenameFor(sourceById(id))}
            onEnd={(id) => setEndFor(sourceById(id))}
            onReactivate={handleReactivate}
            onDeleteSource={(id) => {
              const s = sourceById(id);
              if (s)
                setToDelete({ kind: "source", id: s.id, title: s.name });
            }}
          />
        </>
      ) : (
        <>
          <YearGrid
            sources={sources}
            entries={entries}
            months={grid}
            year={year}
            onEditCell={openOverride}
          />
          <YearAccordion
            sources={sources}
            entries={entries}
            months={grid}
            year={year}
            onEditCell={openOverride}
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
      {raiseFor && (
        <RaiseDialog
          source={raiseFor}
          defaultYear={year}
          defaultMonth={month}
          onClose={() => setRaiseFor(null)}
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
      {renameFor && (
        <RenameSourceDialog
          source={renameFor}
          onClose={() => setRenameFor(null)}
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
