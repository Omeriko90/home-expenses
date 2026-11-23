"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { upsertDeposits } from "@/app/actions/investments";
import {
  createDepositsFormSchema,
  type DepositsFormValues,
} from "@/lib/schemas/investments";
import { FormDialog } from "@/components/ui/form/form-dialog";
import { MoneyField } from "@/components/ui/form/money-field";

export function DepositsForm({
  open,
  onClose,
  portfolioId,
  year,
  current,
}: {
  open: boolean;
  onClose: () => void;
  portfolioId: string;
  year: number;
  current: number;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const schema = useMemo(() => createDepositsFormSchema(), []);

  function handleSubmit(values: DepositsFormValues) {
    startTransition(async () => {
      await upsertDeposits(portfolioId, year, values.value ?? 0);
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={`${t.investments.setDeposits} (${year})`}
      schema={schema}
      defaultValues={{ value: current || undefined }}
      onSubmit={handleSubmit}
      pending={pending}
      contentClassName="max-w-sm"
    >
      <MoneyField name="value" label={t.investments.deposits} required />
    </FormDialog>
  );
}
