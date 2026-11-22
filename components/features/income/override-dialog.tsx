"use client";

import * as React from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { clearMonthOverride, setMonthOverride } from "@/app/actions/income";
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { RhfFormDialog } from "@/components/ui/form/form-dialog";
import { MoneyField } from "@/components/ui/form/money-field";
import { Button } from "@/components/ui/button";
import type { IncomeEntryData, IncomeSourceData } from "./types";

const schema = z.object({
  amount: z.number().min(0),
});

type FormValues = z.infer<typeof schema>;

export function OverrideDialog({
  source,
  year,
  month,
  currentAmount,
  existingOverride,
  onClose,
}: {
  source: IncomeSourceData;
  year: number;
  month: number;
  currentAmount: number | null;
  existingOverride: IncomeEntryData | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = React.useTransition();

  const methods = useZodForm<FormValues, FormValues>(schema, {
    defaultValues: {
      amount: existingOverride?.amount ?? currentAmount ?? undefined,
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      await setMonthOverride(source.id, {
        year,
        month,
        amount: values.amount,
        note: existingOverride?.note ?? null,
      });
      toast.success(t.common.save);
      onClose();
    });
  }

  function clear() {
    startTransition(async () => {
      await clearMonthOverride(source.id, { year, month });
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <RhfFormDialog
      open
      onClose={onClose}
      title={`${source.name} — ${t.months[month - 1]} ${year}`}
      methods={methods}
      onSubmit={onSubmit}
      pending={pending}
    >
      <MoneyField
        name="amount"
        label={t.common.amount}
        required
        hint={t.income.overrideHint}
      />
      {existingOverride && (
        <Button
          type="button"
          variant="outline"
          onClick={clear}
          disabled={pending}
          className="self-start"
        >
          {t.income.clearOverride}
        </Button>
      )}
    </RhfFormDialog>
  );
}
