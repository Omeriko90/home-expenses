"use client";

import * as React from "react";
import { z } from "zod";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { addRaise } from "@/app/actions/income";
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { RhfFormDialog } from "@/components/ui/form/form-dialog";
import { MoneyField } from "@/components/ui/form/money-field";
import { Field } from "@/components/shared/field";
import { MonthYearField } from "@/components/shared/month-year-field";
import type { IncomeSourceData } from "./types";

const schema = z.object({
  amount: z.number().min(0),
  ym: z.object({ year: z.number().int(), month: z.number().int() }),
});

type FormValues = z.infer<typeof schema>;

export function RaiseDialog({
  source,
  defaultYear,
  defaultMonth,
  onClose,
}: {
  source: IncomeSourceData;
  defaultYear: number;
  defaultMonth: number;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = React.useTransition();

  const methods = useZodForm<FormValues, FormValues>(schema, {
    defaultValues: {
      amount: undefined,
      ym: { year: defaultYear, month: defaultMonth },
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      await addRaise(source.id, {
        amount: values.amount,
        year: values.ym.year,
        month: values.ym.month,
        note: null,
      });
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <RhfFormDialog
      open
      onClose={onClose}
      title={`${t.income.raise} — ${source.name}`}
      methods={methods}
      onSubmit={onSubmit}
      pending={pending}
    >
      <MoneyField name="amount" label={t.common.amount} required />
      <Controller
        name="ym"
        control={methods.control}
        render={({ field }) => (
          <Field label={t.income.raiseFrom} htmlFor="raise-ym">
            <MonthYearField
              id="raise-ym"
              year={field.value.year}
              month={field.value.month}
              onChange={(year, month) => field.onChange({ year, month })}
            />
          </Field>
        )}
      />
      <p className="text-sm text-muted-foreground">{t.income.raiseHint}</p>
    </RhfFormDialog>
  );
}
