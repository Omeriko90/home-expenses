"use client";

import { useMemo, useTransition } from "react";
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
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { FormDialog } from "@/components/ui/form/form-dialog";
import { TextField } from "@/components/ui/form/text-field";
import { MoneyField } from "@/components/ui/form/money-field";
import { SelectField } from "@/components/ui/form/select-field";
import { MonthYearField } from "@/components/ui/form/month-year-field";
import { useWatch } from "react-hook-form";
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
  const methods = useZodForm(schema, {
    defaultValues: {
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
    },
  });
  const type = useWatch({ control: methods.control, name: "type" });
  const hasEnd = useWatch({ control: methods.control, name: "hasEnd" });

  function handleSubmit(values: IncomeFormValues) {
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
          methods.setError("name", {
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
      methods={methods}
      onSubmit={handleSubmit}
      pending={pending}
    >
      {!editingOneTime && (
        <SelectField
          name="type"
          label={t.common.type}
          options={[
            { value: IncomeType.Fixed, label: t.income.typeFixed },
            { value: IncomeType.OneTime, label: t.income.typeOneTime },
          ]}
          onValueChange={(value) => {
            if (value !== IncomeType.Fixed) {
              methods.setValue("hasEnd", EndSelections.None);
              methods.clearErrors("end");
            }
          }}
        />
      )}

      <TextField
        name="name"
        label={t.common.name}
        placeholder={t.income.nameHint}
        required
      />

      <MoneyField name="amount" label={t.common.amount} required />

      <MonthYearField
        name="start"
        label={type === IncomeType.Fixed ? t.income.startMonth : t.common.month}
      />

      {type === IncomeType.Fixed && !editingOneTime && (
        <>
          <SelectField
            name="hasEnd"
            label={t.income.endMonth}
            options={[
              { value: EndSelections.None, label: t.income.noEnd },
              { value: EndSelections.Custom, label: t.income.pickEndMonth },
            ]}
          />
          {hasEnd === EndSelections.Custom && <MonthYearField name="end" />}
          <p className="text-sm text-muted-foreground">{t.income.fixedHint}</p>
        </>
      )}

      <TextField name="note" label={t.transactions.note} />
    </FormDialog>
  );
}
