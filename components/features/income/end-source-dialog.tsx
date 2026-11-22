"use client";

import * as React from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { endIncomeSource } from "@/app/actions/income";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { MonthYearField } from "@/components/shared/month-year-field";
import type { IncomeSourceData } from "./types";

export function EndSourceDialog({
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
  const [year, setYear] = React.useState(defaultYear);
  const [month, setMonth] = React.useState(defaultMonth);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await endIncomeSource(source.id, { year, month });
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <FormDialog
      open
      onClose={onClose}
      title={`${t.income.end} — ${source.name}`}
      onSubmit={submit}
      pending={pending}
      submitLabel={t.income.end}
    >
      <Field label={t.income.endAfter} htmlFor="end-ym">
        <MonthYearField
          id="end-ym"
          year={year}
          month={month}
          onChange={(y, m) => {
            setYear(y);
            setMonth(m);
          }}
        />
      </Field>
      <p className="text-sm text-muted-foreground">{t.income.endHint}</p>
    </FormDialog>
  );
}
