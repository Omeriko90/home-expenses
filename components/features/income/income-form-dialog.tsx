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
import { Select } from "@/components/ui/select/Select";
import { monthKey } from "@/lib/income-resolve";
import type { IncomeEntryData } from "./types";

const schema = z.object({
  type: z.enum(["FIXED", "ONE_TIME"]),
  name: z.string().min(1),
  amount: z.number().min(0),
  ym: z.object({ year: z.number().int(), month: z.number().int() }),
  endYm: z.object({ year: z.number().int(), month: z.number().int() }),
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
  const [hasEnd, setHasEnd] = React.useState(false);

  const methods = useZodForm<FormValues, FormValues>(schema, {
    defaultValues: editingOneTime
      ? {
          type: "ONE_TIME",
          name: editingOneTime.name ?? "",
          amount: editingOneTime.amount,
          ym: { year: editingOneTime.year, month: editingOneTime.month },
          endYm: { year: editingOneTime.year, month: editingOneTime.month },
          note: editingOneTime.note ?? "",
        }
      : {
          type: "FIXED",
          name: "",
          amount: undefined,
          ym: { year: defaultYear, month: defaultMonth },
          endYm: { year: defaultYear, month: defaultMonth },
          note: "",
        },
  });
  const type = methods.watch("type");

  function onSubmit(values: FormValues) {
    const withEnd = values.type === "FIXED" && !editingOneTime && hasEnd;
    if (
      withEnd &&
      monthKey(values.endYm.year, values.endYm.month) <
        monthKey(values.ym.year, values.ym.month)
    ) {
      toast.error(t.income.endBeforeStart);
      return;
    }
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
          ? await createIncomeSource({
              ...input,
              endYear: withEnd ? values.endYm.year : null,
              endMonth: withEnd ? values.endYm.month : null,
            })
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
        <>
          <Field label={t.income.endMonth}>
            <div className="flex flex-col gap-2">
              <Select
                value={hasEnd ? "custom" : "none"}
                onValueChange={(v) => setHasEnd(v === "custom")}
                options={[
                  { value: "none", label: t.income.noEnd },
                  { value: "custom", label: t.income.pickEndMonth },
                ]}
              />
              {hasEnd && (
                <Controller
                  name="endYm"
                  control={methods.control}
                  render={({ field }) => (
                    <MonthYearField
                      year={field.value.year}
                      month={field.value.month}
                      onChange={(year, month) =>
                        field.onChange({ year, month })
                      }
                    />
                  )}
                />
              )}
            </div>
          </Field>
          <p className="text-sm text-muted-foreground">{t.income.fixedHint}</p>
        </>
      )}
      <TextField name="note" label={t.transactions.note} />
    </RhfFormDialog>
  );
}
