"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import {
  createPlannedItem,
  updatePlannedItem,
  type PlannedItemInput,
} from "@/app/actions/planned-items";
import {
  createPlannedItemFormSchema,
  type PlannedItemFormValues,
} from "@/lib/schemas/planned-items";
import { EndSelections } from "@/lib/schemas/common";
import { FormDialog } from "@/components/ui/form/form-dialog";
import { PlannedItemFormFields } from "./planned-item-form-fields";
import {
  DURATION_PRESETS,
  PlannedItemTypes,
  type ForecastItem,
  type PlanningCategory,
} from "./types";

function initialEndSelection(editing: ForecastItem | null): string {
  if (!editing || editing.endYear == null || editing.endMonth == null)
    return EndSelections.None;
  const duration =
    editing.endYear * 12 +
    editing.endMonth -
    (editing.startYear * 12 + editing.startMonth) +
    1;
  return DURATION_PRESETS.includes(duration)
    ? String(duration)
    : EndSelections.Custom;
}

function resolveEnd(values: PlannedItemFormValues): {
  endYear: number | null;
  endMonth: number | null;
} {
  if (
    values.type !== PlannedItemTypes.Recurring ||
    values.endSelection === EndSelections.None
  )
    return { endYear: null, endMonth: null };
  if (values.endSelection === EndSelections.Custom)
    return { endYear: values.end.year, endMonth: values.end.month };
  const endIndex =
    values.start.year * 12 +
    (values.start.month - 1) +
    Number(values.endSelection) -
    1;
  return {
    endYear: Math.floor(endIndex / 12),
    endMonth: (endIndex % 12) + 1,
  };
}

export function PlannedItemForm({
  open,
  onClose,
  editing,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  editing: ForecastItem | null;
  categories: PlanningCategory[];
}) {
  const { t } = useI18n();
  const now = new Date();
  const [pending, startTransition] = useTransition();
  const schema = useMemo(() => createPlannedItemFormSchema(t), [t]);

  function handleSubmit(values: PlannedItemFormValues) {
    const end = resolveEnd(values);
    const plannedItemInput: PlannedItemInput = {
      title: values.title,
      type: values.type,
      amount: values.amount,
      installments:
        values.type === PlannedItemTypes.Installments
          ? (values.installments ?? null)
          : null,
      startYear: values.start.year,
      startMonth: values.start.month,
      endYear: end.endYear,
      endMonth: end.endMonth,
      note: values.note.trim() || null,
      categoryId: values.categoryId || null,
    };
    startTransition(async () => {
      if (editing) await updatePlannedItem(editing.id, plannedItemInput);
      else await createPlannedItem(plannedItemInput);
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={editing ? t.planning.edit : t.planning.add}
      schema={schema}
      defaultValues={{
        title: editing?.title ?? "",
        type: editing?.type ?? PlannedItemTypes.OneTime,
        amount: editing?.amount ?? undefined,
        installments: editing?.installments ?? undefined,
        start: {
          year: editing?.startYear ?? now.getFullYear(),
          month: editing?.startMonth ?? now.getMonth() + 1,
        },
        endSelection: initialEndSelection(editing),
        end: {
          year: editing?.endYear ?? now.getFullYear() + 1,
          month: editing?.endMonth ?? now.getMonth() + 1,
        },
        categoryId: editing?.categoryId ?? "",
        note: editing?.note ?? "",
      }}
      onSubmit={handleSubmit}
      pending={pending}
    >
      <PlannedItemFormFields categories={categories} />
    </FormDialog>
  );
}
