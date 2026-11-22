"use client";

import * as React from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { renameIncomeSource } from "@/app/actions/income";
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { RhfFormDialog } from "@/components/ui/form/form-dialog";
import { TextField } from "@/components/ui/form/text-field";
import type { IncomeSourceData } from "./types";

const schema = z.object({
  name: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function RenameSourceDialog({
  source,
  onClose,
}: {
  source: IncomeSourceData;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = React.useTransition();

  const methods = useZodForm<FormValues, FormValues>(schema, {
    defaultValues: { name: source.name },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await renameIncomeSource(source.id, values.name.trim());
      if ("error" in result) {
        toast.error(
          result.error === "duplicateName"
            ? t.income.duplicate
            : t.common.noData,
        );
        return;
      }
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <RhfFormDialog
      open
      onClose={onClose}
      title={t.income.rename}
      methods={methods}
      onSubmit={onSubmit}
      pending={pending}
    >
      <TextField name="name" label={t.common.name} required />
    </RhfFormDialog>
  );
}
