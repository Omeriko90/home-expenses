"use client";

import * as React from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import type { PortfolioSummary } from "@/lib/summary";
import { upsertHolding } from "@/app/actions/investments";
import {
  Autocomplete,
  type AutocompleteOption,
} from "@/components/shared/autocomplete";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { MoneyInput } from "@/components/shared/money-input";
import { Input } from "@/components/ui/input";

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
  const [pending, startTransition] = React.useTransition();
  const [instrument, setInstrument] = React.useState(editing?.instrument ?? "");
  const [house, setHouse] = React.useState(editing?.house ?? "");
  const [channel, setChannel] = React.useState(editing?.channel ?? "");
  const [type, setType] = React.useState(editing?.type ?? "");
  const [value, setValue] = React.useState<number | "">(editing?.value ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!instrument.trim() || value === "") {
      toast.error(t.common.noData);
      return;
    }
    startTransition(async () => {
      await upsertHolding({
        portfolioId,
        holdingId: editing?.id ?? null,
        instrument: instrument.trim(),
        house: house.trim(),
        channel: channel.trim(),
        type: type.trim(),
        year,
        value: Number(value),
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
      onSubmit={submit}
      pending={pending}
    >
      <Field label={t.investments.instrument} htmlFor="h-inst" required>
        <Input
          id="h-inst"
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
          required
        />
      </Field>
      <Field label={t.common.type} htmlFor="h-type">
        <Autocomplete
          id="h-type"
          options={typeOptions}
          value={type || null}
          onChange={setType}
          customValueLabel={t.common.addCustom}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label={t.investments.house} htmlFor="h-house">
          <Input
            id="h-house"
            value={house}
            onChange={(e) => setHouse(e.target.value)}
          />
        </Field>
        <Field label={t.investments.channel} htmlFor="h-chan">
          <Input
            id="h-chan"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          />
        </Field>
      </div>
      <Field label={`${t.investments.value} (${year})`} required>
        <MoneyInput value={value} onValueChange={setValue} />
      </Field>
    </FormDialog>
  );
}
