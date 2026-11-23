"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { createGoal, updateGoal, type GoalInput } from "@/app/actions/goals";
import {
  createGoalFormSchema,
  GoalTypes,
  GoalLinkKinds,
  type GoalFormValues,
} from "@/lib/schemas/goals";
import { FormDialog } from "@/components/ui/form/form-dialog";
import { GoalFormFields } from "./goal-form-fields";
import type { Goal, GoalCategory } from "./types";

export function GoalForm({
  open,
  onClose,
  editing,
  categories,
  year,
}: {
  open: boolean;
  onClose: () => void;
  editing: Goal | null;
  categories: GoalCategory[];
  year: number;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const schema = useMemo(() => createGoalFormSchema(t), [t]);

  function handleSubmit(values: GoalFormValues) {
    const input: GoalInput = {
      title: values.title,
      year,
      type: values.type,
      note: values.note.trim() || null,
      targetAmount:
        values.type === GoalTypes.Numeric ? (values.target ?? 0) : null,
      currentAmount:
        values.type === GoalTypes.Numeric &&
        values.linkKind === GoalLinkKinds.None
          ? (values.current ?? 0)
          : null,
      linkKind: values.linkKind,
      linkCategoryId:
        values.linkKind === GoalLinkKinds.Category
          ? values.linkCategoryId
          : null,
      milestones:
        values.type === GoalTypes.Checklist
          ? values.milestonesText
              .split("\n")
              .map((milestone) => milestone.trim())
              .filter(Boolean)
          : undefined,
    };
    startTransition(async () => {
      if (editing) await updateGoal(editing.id, input);
      else await createGoal(input);
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={editing ? t.goals.edit : t.goals.add}
      schema={schema}
      defaultValues={{
        title: editing?.title ?? "",
        type: editing?.type ?? GoalTypes.Numeric,
        linkKind: editing?.linkKind ?? GoalLinkKinds.None,
        linkCategoryId: editing?.linkCategoryId ?? "",
        target: editing?.target ?? undefined,
        current: editing?.current ?? undefined,
        milestonesText:
          editing?.milestones.map((milestone) => milestone.title).join("\n") ??
          "",
        note: editing?.note ?? "",
      }}
      onSubmit={handleSubmit}
      pending={pending}
    >
      <GoalFormFields isEditing={!!editing} categories={categories} />
    </FormDialog>
  );
}
