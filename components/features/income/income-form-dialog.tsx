"use client";

import { useMemo, useTransition } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import {
  createIncomeSource,
  createOneTimeIncome,
  updateOneTimeIncome,
} from "@/app/actions/income";
import {
  createIncomeFormSchema,
  type IncomeFormValues,
} from "@/lib/schemas/income";
import { EndSelections } from "@/lib/schemas/common";
import { FormDialog } from "@/components/ui/form/form-dialog";
import { IncomeFormFields } from "./income-form-fields";
import { IncomeType, type IncomeEntryData } from "./types";

export function IncomeFormDialog({
  onClose,
  defaultYear,
  defaultMonth,
  editingOneTime,
}: {
  onClose: () => void;
  defaultYear: number;
  defaultMonth: number;
  editingOneTime?: IncomeEntryData | null;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const schema = useMemo(() => createIncomeFormSchema(t), [t]);

  function handleSubmit(
    values: IncomeFormValues,
    form: UseFormReturn<IncomeFormValues, unknown, IncomeFormValues>,
  ) {
    const withEnd =
      values.type === IncomeType.Fixed &&
      !editingOneTime &&
      values.hasEnd === EndSelections.Custom;
    const input = {
      name: values.name,
      amount: values.amount,
      year: values.start.year,
      month: values.start.month,
      note: values.note.trim() || null,
    };
    startTransition(async () => {
      const result = editingOneTime
        ? await updateOneTimeIncome(editingOneTime.id, input)
        : values.type === IncomeType.Fixed
          ? await createIncomeSource({
              ...input,
              endYear: withEnd ? values.end.year : null,
              endMonth: withEnd ? values.end.month : null,
            })
          : await createOneTimeIncome(input);
      if ("error" in result) {
        if (result.error === "duplicateName") {
          form.setError("name", {
            type: "server",
            message: t.income.duplicate,
          });
        } else {
          toast.error(t.common.noData);
        }
        return;
      }
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <FormDialog
      open
      onClose={onClose}
      title={editingOneTime ? t.income.edit : t.income.add}
      schema={schema}
      defaultValues={{
        type: editingOneTime ? IncomeType.OneTime : IncomeType.Fixed,
        name: editingOneTime?.name ?? "",
        amount: editingOneTime?.amount ?? undefined,
        start: {
          year: editingOneTime?.year ?? defaultYear,
          month: editingOneTime?.month ?? defaultMonth,
        },
        hasEnd: EndSelections.None,
        end: { year: defaultYear, month: defaultMonth },
        note: editingOneTime?.note ?? "",
      }}
      onSubmit={handleSubmit}
      pending={pending}
    >
      <IncomeFormFields isEditing={!!editingOneTime} />
    </FormDialog>
  );
}
