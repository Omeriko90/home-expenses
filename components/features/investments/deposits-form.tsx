"use client";

import * as React from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { upsertDeposits } from "@/app/actions/investments";
import { Field } from "@/components/shared/field";
import { MoneyInput } from "@/components/shared/money-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/baseDialogComponents";

export function DepositsForm({
  open,
  onOpenChange,
  portfolioId,
  year,
  current,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  portfolioId: string;
  year: number;
  current: number;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = React.useTransition();
  const [value, setValue] = React.useState<number | "">(current || "");

  React.useEffect(() => {
    if (open) setValue(current || "");
  }, [open, current]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await upsertDeposits(portfolioId, year, typeof value === "number" ? value : 0);
      toast.success(t.common.save);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {t.investments.setDeposits} ({year})
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={t.investments.deposits} required>
            <MoneyInput value={value} onValueChange={setValue} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
