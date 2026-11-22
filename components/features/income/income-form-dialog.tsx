"use client";

import * as React from "react";
import { z } from "zod";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import {
  createIncomeSource,
  createOneTimeIncome,
  updateOneTimeIncome,
} from "@/app/actions/income";
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { RhfFormDialog } from "@/components/ui/form/form-dialog";
import { TextField } from "@/components/ui/form/text-field";
import { MoneyField } from "@/components/ui/form/money-field";
import { SelectField } from "@/components/ui/form/select-field";
import { Field } from "@/components/shared/field";
import { MonthYearField } from "@/components/shared/month-year-field";
import type { IncomeEntryData } from "./types";

const schema = z.object({
  type: z.enum(["FIXED", "ONE_TIME"]),
  name: z.string().min(1),
  amount: z.number().min(0),
  ym: z.object({ year: z.number().int(), month: z.number().int() }),
  note: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

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
  const [pending, startTransition] = React.useTransition();

  const methods = useZodForm<FormValues, FormValues>(schema, {
    defaultValues: editingOneTime
      ? {
          type: "ONE_TIME",
          name: editingOneTime.name ?? "",
          amount: editingOneTime.amount,
          ym: { year: editingOneTime.year, month: editingOneTime.month },
          note: editingOneTime.note ?? "",
        }
      : {
          type: "FIXED",
          name: "",
          amount: undefined,
          ym: { year: defaultYear, month: defaultMonth },
          note: "",
        },
  });
  const type = methods.watch("type");

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const input = {
        name: values.name.trim(),
        amount: values.amount,
        year: values.ym.year,
        month: values.ym.month,
        note: values.note?.trim() || null,
      };
      const result = editingOneTime
        ? await updateOneTimeIncome(editingOneTime.id, input)
        : values.type === "FIXED"
          ? await createIncomeSource(input)
          : await createOneTimeIncome(input);
      if ("error" in result) {
        toast.error(
          result.error === "duplicateName"
            ? t.income.duplicate
            : t.common.noData,
        );
        return;
      }
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <RhfFormDialog
      open
      onClose={onClose}
      title={editingOneTime ? t.income.edit : t.income.add}
      methods={methods}
      onSubmit={onSubmit}
      pending={pending}
    >
      {!editingOneTime && (
        <SelectField
          name="type"
          label={t.common.type}
          options={[
            { value: "FIXED", label: t.income.typeFixed },
            { value: "ONE_TIME", label: t.income.typeOneTime },
          ]}
        />
      )}
      <TextField
        name="name"
        label={t.common.name}
        required
        placeholder={t.income.nameHint}
      />
      <MoneyField name="amount" label={t.common.amount} required />
      <Controller
        name="ym"
        control={methods.control}
        render={({ field }) => (
          <Field
            label={type === "FIXED" ? t.income.startMonth : t.common.month}
            htmlFor="income-ym"
          >
            <MonthYearField
              id="income-ym"
              year={field.value.year}
              month={field.value.month}
              onChange={(year, month) => field.onChange({ year, month })}
            />
          </Field>
        )}
      />
      {type === "FIXED" && !editingOneTime && (
        <p className="text-sm text-muted-foreground">{t.income.fixedHint}</p>
      )}
      <TextField name="note" label={t.transactions.note} />
    </RhfFormDialog>
  );
}
