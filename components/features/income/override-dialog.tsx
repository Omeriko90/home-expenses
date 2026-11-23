"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { clearMonthOverride, setMonthOverride } from "@/app/actions/income";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { MoneyInput } from "@/components/shared/money-input";
import { Button } from "@/components/ui/button";
import type { IncomeEntryData, IncomeSourceData } from "./types";

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
  const [amount, setAmount] = useState<number | "">(
    existingOverride?.amount ?? currentAmount ?? "",
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (typeof amount !== "number") {
      toast.error(t.common.noData);
      return;
    }
    startTransition(async () => {
      await setMonthOverride(source.id, {
        year,
        month,
        amount,
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
      onSubmit={handleSubmit}
      pending={pending}
    >
      <Field label={t.common.amount} required hint={t.income.overrideHint}>
        <MoneyInput value={amount} onValueChange={setAmount} />
      </Field>
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
