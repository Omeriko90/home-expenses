"use client";

import * as React from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { upsertDeposits } from "@/app/actions/investments";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { MoneyInput } from "@/components/shared/money-input";

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
  const [pending, startTransition] = React.useTransition();
  const [value, setValue] = React.useState<number | "">(current || "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await upsertDeposits(portfolioId, year, typeof value === "number" ? value : 0);
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={`${t.investments.setDeposits} (${year})`}
      onSubmit={submit}
      pending={pending}
      contentClassName="max-w-sm"
    >
      <Field label={t.investments.deposits} required>
        <MoneyInput value={value} onValueChange={setValue} />
      </Field>
    </FormDialog>
  );
}
