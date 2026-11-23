"use client";

import { useMemo, useTransition } from "react";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { createGoal, updateGoal, type GoalInput } from "@/app/actions/goals";
import {
  createGoalFormSchema,
  GoalTypes,
  GoalLinkKinds,
  type GoalFormValues,
} from "@/lib/schemas/goals";
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { FormDialog } from "@/components/ui/form/form-dialog";
import { TextField } from "@/components/ui/form/text-field";
import { TextareaField } from "@/components/ui/form/textarea-field";
import { MoneyField } from "@/components/ui/form/money-field";
import { SelectField } from "@/components/ui/form/select-field";
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
  const methods = useZodForm(schema, {
    defaultValues: {
      title: editing?.title ?? "",
      type: editing?.type ?? GoalTypes.Numeric,
      linkKind: editing?.linkKind ?? GoalLinkKinds.None,
      linkCategoryId: editing?.linkCategoryId ?? "",
      target: editing?.target ?? undefined,
      current: editing?.current ?? undefined,
      milestonesText: editing?.milestones.map((milestone) => milestone.title).join("\n") ?? "",
      note: editing?.note ?? "",
    },
  });
  const type = useWatch({ control: methods.control, name: "type" });
  const linkKind = useWatch({ control: methods.control, name: "linkKind" });

  function handleSubmit(values: GoalFormValues) {
    const input: GoalInput = {
      title: values.title,
      year,
      type: values.type,
      note: values.note.trim() || null,
      targetAmount: values.type === GoalTypes.Numeric ? (values.target ?? 0) : null,
      currentAmount:
        values.type === GoalTypes.Numeric && values.linkKind === GoalLinkKinds.None
          ? (values.current ?? 0)
          : null,
      linkKind: values.linkKind,
      linkCategoryId:
        values.linkKind === GoalLinkKinds.Category ? values.linkCategoryId : null,
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
      methods={methods}
      onSubmit={handleSubmit}
      pending={pending}
    >
      <TextField name="title" label={t.common.name} required />

      {!editing && (
        <SelectField
          name="type"
          label={t.common.type}
          options={[
            { value: GoalTypes.Numeric, label: t.goals.numeric },
            { value: GoalTypes.Checklist, label: t.goals.checklist },
          ]}
          onValueChange={() => methods.clearErrors()}
        />
      )}

      {type === GoalTypes.Numeric ? (
        <>
          <SelectField
            name="linkKind"
            label={t.goals.linkTo}
            options={[
              { value: GoalLinkKinds.None, label: t.goals.linkNone },
              { value: GoalLinkKinds.Category, label: t.goals.linkCategory },
              {
                value: GoalLinkKinds.InvestmentTotal,
                label: t.goals.linkInvestment,
              },
            ]}
          />
          {linkKind === GoalLinkKinds.Category && (
            <SelectField
              name="linkCategoryId"
              label={t.goals.linkCategory}
              placeholder={t.common.category}
              options={categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <MoneyField name="target" label={t.goals.target} required />
            {linkKind === GoalLinkKinds.None && (
              <MoneyField name="current" label={t.goals.current} />
            )}
          </div>
        </>
      ) : (
        <TextareaField
          name="milestonesText"
          label={t.goals.milestone}
          hint={t.goals.addMilestone}
          rows={4}
        />
      )}

      <TextField name="note" label={t.transactions.note} />
    </FormDialog>
  );
}
