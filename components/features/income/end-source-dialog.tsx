"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { endIncomeSource } from "@/app/actions/income";
import {
  createEndSourceFormSchema,
  type EndSourceFormValues,
} from "@/lib/schemas/income";
import { FormDialog } from "@/components/ui/form/form-dialog";
import { MonthYearField } from "@/components/ui/form/month-year-field";
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
  const [pending, startTransition] = useTransition();
  const schema = useMemo(() => createEndSourceFormSchema(), []);

  function handleSubmit(values: EndSourceFormValues) {
    startTransition(async () => {
      await endIncomeSource(source.id, values.end);
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <FormDialog
      open
      onClose={onClose}
      title={`${t.income.end} — ${source.name}`}
      schema={schema}
      defaultValues={{ end: { year: defaultYear, month: defaultMonth } }}
      onSubmit={handleSubmit}
      pending={pending}
      submitLabel={t.income.end}
    >
      <MonthYearField name="end" label={t.income.endAfter} />
      <p className="text-sm text-muted-foreground">{t.income.endHint}</p>
    </FormDialog>
  );
}
