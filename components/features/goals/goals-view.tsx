"use client";

import * as React from "react";
import { Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { deleteGoal } from "@/app/actions/goals";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { YearSelect } from "@/components/shared/year-select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { GoalCard } from "./goal-card";
import { GoalForm } from "./goal-form";
import type { Goal, GoalCategory } from "./types";

export function GoalsView({
  year,
  years,
  goals,
  categories,
}: {
  year: number;
  years: number[];
  goals: Goal[];
  categories: GoalCategory[];
}) {
  const { t } = useI18n();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Goal | null>(null);
  const [toDelete, setToDelete] = React.useState<Goal | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      await deleteGoal(toDelete.id);
      toast.success(t.common.delete);
      setToDelete(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t.goals.title}
        actions={
          <div className="flex items-center gap-2">
            <YearSelect year={year} years={years} />
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus /> {t.goals.add}
            </Button>
          </div>
        }
      />

      {goals.length === 0 ? (
        <EmptyState icon={<Target />} title={t.goals.empty} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={() => {
                setEditing(g);
                setFormOpen(true);
              }}
              onDelete={() => setToDelete(g)}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <GoalForm
          open
          onClose={() => setFormOpen(false)}
          editing={editing}
          categories={categories}
          year={year}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          open
          onClose={() => setToDelete(null)}
          title={t.goals.deleteConfirm}
          description={toDelete.title}
          onConfirm={handleDelete}
          loading={pending}
        />
      )}
    </div>
  );
}
