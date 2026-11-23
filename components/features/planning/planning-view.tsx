"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Info, Plus } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import {
  deletePlannedItem,
  updatePlannedItem,
  type PlannedItemInput,
} from "@/app/actions/planned-items";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard } from "@/components/shared/charts/chart-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ForecastChart } from "./forecast-chart";
import { RangeSelect } from "./range-select";
import { PlannedItemRow } from "./planned-item-row";
import { PlannedItemForm } from "./planned-item-form";
import { ArchivedItems } from "./archived-items";
import { usePlannedTotals } from "./use-planned-totals";
import {
  formatMonthKey,
  PlannedItemStatuses,
  type ArchivedItem,
  type ForecastData,
  type ForecastItem,
  type PlannedItemStatus,
  type PlanningCategory,
  type RangeMonths,
} from "./types";

export function PlanningView({
  range,
  forecast,
  archived,
  categories,
}: {
  range: RangeMonths;
  forecast: ForecastData;
  archived: ArchivedItem[];
  categories: PlanningCategory[];
}) {
  const { t } = useI18n();
  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ForecastItem | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const { months, baselineTotal, income, items, baselineMonthsUsed } = forecast;
  const hasIncome = income.some((amount) => amount > 0);
  const { planned, totalPlanned, worstMonth, worstMonthSpend } =
    usePlannedTotals(forecast, excludedIds);

  function handleIncludeToggleChange(id: string, included: boolean) {
    setExcludedIds((previous) => {
      const next = new Set(previous);
      if (included) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      await deletePlannedItem(toDelete.id);
      toast.success(t.common.delete);
      setToDelete(null);
    });
  }

  function handleSetStatus(
    item: ForecastItem | ArchivedItem,
    status: PlannedItemStatus,
  ) {
    const plannedItemInput: PlannedItemInput = {
      title: item.title,
      type: item.type,
      status,
      amount: item.amount,
      installments: item.installments,
      startYear: item.startYear,
      startMonth: item.startMonth,
      endYear: item.endYear,
      endMonth: item.endMonth,
      note: item.note,
      categoryId: item.categoryId,
    };
    startTransition(async () => {
      await updatePlannedItem(item.id, plannedItemInput);
      toast.success(t.common.save);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <div className="flex w-full items-center justify-between gap-2">
            <RangeSelect range={range} />
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus /> {t.planning.add}
            </Button>
          </div>
        }
      />

      {baselineMonthsUsed === 0 && (
        <p className="flex items-center gap-2 rounded-lg border border-warning-border bg-warning-subtle px-3 py-2 text-sm text-warning">
          <Info className="size-4 shrink-0" />
          {t.planning.lowHistoryHint}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t.planning.avgBaseline}
          value={formatMoney(baselineTotal[0] ?? 0)}
          accent="expense"
        />
        <StatCard
          label={t.planning.totalPlanned}
          value={formatMoney(totalPlanned)}
          accent="primary"
        />
        <StatCard
          label={t.planning.worstMonth}
          value={formatMoney(worstMonthSpend)}
          accent={hasIncome ? "income" : "expense"}
          sub={
            <span className="text-muted-foreground tnum">
              {formatMonthKey(worstMonth.year, worstMonth.month)}
            </span>
          }
        />
      </div>

      <ChartCard
        title={t.planning.chartTitle}
        description={t.planning.chartDesc}
        contentClassName="h-56 sm:h-72"
      >
        <ForecastChart
          months={months}
          baseline={baselineTotal}
          planned={planned}
          income={income}
        />
      </ChartCard>

      {items.length === 0 ? (
        <EmptyState icon={<CalendarClock />} title={t.planning.empty} />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {items.map((item) => (
            <PlannedItemRow
              key={item.id}
              item={item}
              included={!excludedIds.has(item.id)}
              onIncludedChange={(included) =>
                handleIncludeToggleChange(item.id, included)
              }
              onEdit={() => {
                setEditing(item);
                setFormOpen(true);
              }}
              onDelete={() => setToDelete({ id: item.id, title: item.title })}
              onSetStatus={(status) => handleSetStatus(item, status)}
            />
          ))}
        </Card>
      )}

      {archived.length > 0 && (
        <ArchivedItems
          items={archived}
          onRestore={(item) => handleSetStatus(item, PlannedItemStatuses.Active)}
          onDelete={(item) => setToDelete({ id: item.id, title: item.title })}
        />
      )}

      {formOpen && (
        <PlannedItemForm
          open
          onClose={() => setFormOpen(false)}
          editing={editing}
          categories={categories}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          open
          onClose={() => setToDelete(null)}
          title={t.planning.deleteConfirm}
          description={toDelete.title}
          onConfirm={handleDelete}
          loading={pending}
        />
      )}
    </div>
  );
}
