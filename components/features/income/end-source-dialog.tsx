"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { endIncomeSource } from "@/app/actions/income";
import {
  createEndSourceFormSchema,
  type EndSourceFormValues,
} from "@/lib/schemas/income";
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { RhfFormDialog } from "@/components/ui/form/form-dialog";
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
  const methods = useZodForm(schema, {
    defaultValues: { end: { year: defaultYear, month: defaultMonth } },
  });

  function handleSubmit(values: EndSourceFormValues) {
    startTransition(async () => {
      await endIncomeSource(source.id, values.end);
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <RhfFormDialog
      open
      onClose={onClose}
      title={`${t.income.end} — ${source.name}`}
      methods={methods}
      onSubmit={handleSubmit}
      pending={pending}
      submitLabel={t.income.end}
    >
      <MonthYearField name="end" label={t.income.endAfter} />
      <p className="text-sm text-muted-foreground">{t.income.endHint}</p>
    </RhfFormDialog>
  );
}
