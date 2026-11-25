"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { clearMonthOverride, setMonthOverride } from "@/app/actions/income";
import {
  createOverrideFormSchema,
  type OverrideFormValues,
} from "@/lib/schemas/income";
import { FormDialog } from "@/components/ui/form/form-dialog";
import { MoneyField } from "@/components/ui/form/money-field";
import { Button } from "@/components/ui/button";
import {
  AmountTypes,
  type IncomeEntryData,
  type IncomeSourceData,
} from "./types";

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
  const [pending, startTransition] = useTransition();
  const schema = useMemo(() => createOverrideFormSchema(t), [t]);

  function handleSubmit(values: OverrideFormValues) {
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
    <FormDialog
      open
      onClose={onClose}
      title={`${source.name} — ${t.months[month - 1]} ${year}`}
      schema={schema}
      defaultValues={{
        amount:
          existingOverride?.grossAmount ??
          existingOverride?.amount ??
          currentAmount ??
          undefined,
      }}
      onSubmit={handleSubmit}
      pending={pending}
    >
      <MoneyField
        name="amount"
        label={
          source.amountType === AmountTypes.Gross
            ? `${t.common.amount} (${t.income.gross})`
            : t.common.amount
        }
        hint={t.income.overrideHint}
        required
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
    </FormDialog>
  );
}
