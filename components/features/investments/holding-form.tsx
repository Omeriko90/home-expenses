"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import type { PortfolioSummary } from "@/lib/summary";
import { upsertHolding } from "@/app/actions/investments";
import type { AutocompleteOption } from "@/components/shared/autocomplete";
import {
  createHoldingFormSchema,
  type HoldingFormValues,
} from "@/lib/schemas/investments";
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { FormDialog } from "@/components/ui/form/form-dialog";
import { TextField } from "@/components/ui/form/text-field";
import { MoneyField } from "@/components/ui/form/money-field";
import { AutocompleteField } from "@/components/ui/form/autocomplete-field";

export type Holding = PortfolioSummary["holdings"][number];

export function HoldingForm({
  open,
  onClose,
  editing,
  portfolioId,
  year,
  typeOptions,
}: {
  open: boolean;
  onClose: () => void;
  editing: Holding | null;
  portfolioId: string;
  year: number;
  typeOptions: AutocompleteOption[];
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const schema = useMemo(() => createHoldingFormSchema(t), [t]);
  const methods = useZodForm(schema, {
    defaultValues: {
      instrument: editing?.instrument ?? "",
      type: editing?.type ?? "",
      house: editing?.house ?? "",
      channel: editing?.channel ?? "",
      value: editing?.value ?? undefined,
    },
  });

  function handleSubmit(values: HoldingFormValues) {
    startTransition(async () => {
      await upsertHolding({
        portfolioId,
        holdingId: editing?.id ?? null,
        instrument: values.instrument,
        house: values.house.trim(),
        channel: values.channel.trim(),
        type: values.type.trim(),
        year,
        value: values.value,
      });
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={editing ? t.investments.editHolding : t.investments.addHolding}
      methods={methods}
      onSubmit={handleSubmit}
      pending={pending}
    >
      <TextField name="instrument" label={t.investments.instrument} required />
      <AutocompleteField
        name="type"
        label={t.common.type}
        options={typeOptions}
        customValueLabel={t.common.addCustom}
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField name="house" label={t.investments.house} />
        <TextField name="channel" label={t.investments.channel} />
      </div>
      <MoneyField
        name="value"
        label={`${t.investments.value} (${year})`}
        required
      />
    </FormDialog>
  );
}
