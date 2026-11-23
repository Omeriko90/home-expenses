"use client";

import { useMemo, useTransition } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import {
  addRaise,
  endIncomeSource,
  reactivateIncomeSource,
  renameIncomeSource,
  setMonthOverride,
} from "@/app/actions/income";
import {
  ApplyModes,
  createEditSourceFormSchema,
  type EditSourceFormValues,
} from "@/lib/schemas/income";
import { EndSelections } from "@/lib/schemas/common";
import { FormDialog } from "@/components/ui/form/form-dialog";
import { EditSourceFields } from "./edit-source-fields";
import type { IncomeSourceData } from "./types";

export function EditSourceDialog({
  source,
  currentAmount,
  year,
  month,
  onClose,
}: {
  source: IncomeSourceData;
  /** Resolved amount for the selected month; null when inactive there. */
  currentAmount: number | null;
  year: number;
  month: number;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const schema = useMemo(() => createEditSourceFormSchema(t), [t]);

  function handleSubmit(
    values: EditSourceFormValues,
    form: UseFormReturn<EditSourceFormValues, unknown, EditSourceFormValues>,
  ) {
    const endChanged =
      (values.hasEnd === EndSelections.Custom) !== (source.endYear !== null) ||
      (values.hasEnd === EndSelections.Custom &&
        (values.end.year !== source.endYear ||
          values.end.month !== source.endMonth));
    startTransition(async () => {
      if (values.name !== source.name) {
        const result = await renameIncomeSource(source.id, values.name);
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
      }
      if (values.amount !== currentAmount) {
        if (values.applyMode === ApplyModes.Month) {
          await setMonthOverride(source.id, {
            year,
            month,
            amount: values.amount,
            note: null,
          });
        } else {
          await addRaise(source.id, {
            year: values.from.year,
            month: values.from.month,
            amount: values.amount,
            note: null,
          });
        }
      }
      if (endChanged) {
        if (values.hasEnd === EndSelections.Custom) {
          await endIncomeSource(source.id, values.end);
        } else {
          await reactivateIncomeSource(source.id);
        }
      }
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <FormDialog
      open
      onClose={onClose}
      title={`${t.income.edit} — ${source.name}`}
      schema={schema}
      defaultValues={{
        name: source.name,
        amount: currentAmount ?? undefined,
        applyMode: ApplyModes.Permanent,
        from: { year, month },
        hasEnd:
          source.endYear !== null ? EndSelections.Custom : EndSelections.None,
        end: {
          year: source.endYear ?? year,
          month: source.endMonth ?? month,
        },
      }}
      onSubmit={handleSubmit}
      pending={pending}
    >
      <EditSourceFields currentAmount={currentAmount} />
    </FormDialog>
  );
}
