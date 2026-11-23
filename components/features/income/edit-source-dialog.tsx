"use client";

import { useMemo, useTransition } from "react";
import { useWatch } from "react-hook-form";
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
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { FormDialog } from "@/components/ui/form/form-dialog";
import { TextField } from "@/components/ui/form/text-field";
import { MoneyField } from "@/components/ui/form/money-field";
import { SelectField } from "@/components/ui/form/select-field";
import { MonthYearField } from "@/components/ui/form/month-year-field";
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
  const methods = useZodForm(schema, {
    defaultValues: {
      name: source.name,
      amount: currentAmount ?? undefined,
      applyMode: ApplyModes.Permanent,
      from: { year, month },
      hasEnd: source.endYear !== null ? EndSelections.Custom : EndSelections.None,
      end: {
        year: source.endYear ?? year,
        month: source.endMonth ?? month,
      },
    },
  });
  const amount = useWatch({ control: methods.control, name: "amount" });
  const applyMode = useWatch({ control: methods.control, name: "applyMode" });
  const hasEnd = useWatch({ control: methods.control, name: "hasEnd" });
  const amountChanged = typeof amount === "number" && amount !== currentAmount;

  function handleSubmit(values: EditSourceFormValues) {
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
            methods.setError("name", {
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
      methods={methods}
      onSubmit={handleSubmit}
      pending={pending}
    >
      <TextField name="name" label={t.common.name} required />

      <MoneyField name="amount" label={t.common.amount} required />

      {amountChanged && (
        <>
          <SelectField
            name="applyMode"
            label={t.income.amountApply}
            options={[
              { value: ApplyModes.Permanent, label: t.income.applyPermanent },
              { value: ApplyModes.Month, label: t.income.applyThisMonth },
            ]}
          />
          {applyMode === ApplyModes.Permanent && (
            <>
              <MonthYearField name="from" label={t.income.startMonth} />
              <p className="text-sm text-muted-foreground">
                {t.income.raiseHint}
              </p>
            </>
          )}
        </>
      )}

      <SelectField
        name="hasEnd"
        label={t.income.endMonth}
        options={[
          { value: EndSelections.None, label: t.income.noEnd },
          { value: EndSelections.Custom, label: t.income.pickEndMonth },
        ]}
      />
      {hasEnd === EndSelections.Custom && (
        <>
          <MonthYearField name="end" />
          <p className="text-sm text-muted-foreground">{t.income.endHint}</p>
        </>
      )}
    </FormDialog>
  );
}
