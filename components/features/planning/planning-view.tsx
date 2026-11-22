"use client";

import * as React from "react";
import { CalendarClock, Info, Plus } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import {
  deletePlannedItem,
  setPlannedItemStatus,
} from "@/app/actions/planned-items";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard } from "@/components/shared/charts/chart-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ForecastChart } from "./forecast-chart";
import { HorizonSelect } from "./horizon-select";
import { PlannedItemRow } from "./planned-item-row";
import { PlannedItemForm } from "./planned-item-form";
import { ArchivedItems } from "./archived-items";
import {
  formatMonthKey,
  type ArchivedItem,
  type ForecastData,
  type ForecastItem,
  type HorizonMonths,
  type PlanningCategory,
} from "./types";

export function PlanningView({
  horizon,
  forecast,
  archived,
  categories,
}: {
  horizon: HorizonMonths;
  forecast: ForecastData;
  archived: ArchivedItem[];
  categories: PlanningCategory[];
}) {
  const { t } = useI18n();
  const [excludedIds, setExcludedIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ForecastItem | null>(null);
  const [toDelete, setToDelete] = React.useState<{
    id: string;
    title: string;
  } | null>(null);
  const [pending, startTransition] = React.useTransition();

  const { months, baselineTotal, income, items, baselineMonthsUsed } = forecast;
  const hasIncome = income.some((v) => v > 0);

  const planned = React.useMemo(
    () =>
      months.map((_, i) =>
        items.reduce(
          (sum, item) =>
            excludedIds.has(item.id) ? sum : sum + item.impact[i],
          0,
        ),
      ),
    [months, items, excludedIds],
  );

  const totalPlanned = planned.reduce((a, b) => a + b, 0);
  const worstIdx = planned.reduce(
    (worst, _, i) =>
      income[i] - baselineTotal[i] - planned[i] <
      income[worst] - baselineTotal[worst] - planned[worst]
        ? i
        : worst,
    0,
  );
  const worstMonth = months[worstIdx];
  const worstSpend = baselineTotal[worstIdx] + planned[worstIdx];

  function toggleIncluded(id: string, included: boolean) {
    setExcludedIds((prev) => {
      const next = new Set(prev);
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

  function handleSetStatus(id: string, status: "ACTIVE" | "DONE" | "CANCELLED") {
    startTransition(async () => {
      await setPlannedItemStatus(id, status);
      toast.success(t.common.save);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <div className="flex w-full items-center justify-between gap-2">
            <HorizonSelect horizon={horizon} />
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
          value={formatMoney(worstSpend)}
          accent={hasIncome ? "income" : "expense"}
          sub={
            <span className="text-muted-foreground tnum">
              {formatMonthKey(worstMonth.year, worstMonth.month)}
            </span>
          }
        />
      </div>

      <ChartCard title={t.planning.chartTitle} description={t.planning.chartDesc}>
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
              onIncludedChange={(included) => toggleIncluded(item.id, included)}
              onEdit={() => {
                setEditing(item);
                setFormOpen(true);
              }}
              onDelete={() => setToDelete({ id: item.id, title: item.title })}
              onSetStatus={(status) => handleSetStatus(item.id, status)}
            />
          ))}
        </Card>
      )}

      <ArchivedItems
        items={archived}
        onRestore={(id) => handleSetStatus(id, "ACTIVE")}
        onDelete={(item) => setToDelete({ id: item.id, title: item.title })}
      />

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
