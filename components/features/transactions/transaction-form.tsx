"use client";

import * as React from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import {
  createTransaction,
  updateTransaction,
  type TransactionInput,
} from "@/app/actions/transactions";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { MoneyInput } from "@/components/shared/money-input";
import { DatePicker } from "@/components/shared/date-picker";
import {
  Autocomplete,
  type AutocompleteOption,
} from "@/components/shared/autocomplete";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select/Select";

export type TxCategory = {
  id: string;
  name: string;
  type: "EXPENSE" | "INVESTMENT";
  archived: boolean;
};

export type TxRow = {
  id: string;
  date: string;
  businessName: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  kind: "FIXED" | "VARIABLE";
  month: number;
  note: string | null;
};

export function TransactionForm({
  open,
  onClose,
  editing,
  categories,
  year,
  month,
}: {
  open: boolean;
  onClose: () => void;
  editing: TxRow | null;
  categories: TxCategory[];
  year: number;
  month: number;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = React.useTransition();
  const [date, setDate] = React.useState<Date | undefined>(() =>
    editing ? new Date(editing.date) : new Date(Date.UTC(year, month - 1, 1)),
  );
  const [business, setBusiness] = React.useState(editing?.businessName ?? "");
  const [amount, setAmount] = React.useState<number | "">(editing?.amount ?? "");
  const [categoryId, setCategoryId] = React.useState<string | null>(
    editing?.categoryId ?? null,
  );
  const [kind, setKind] = React.useState<"FIXED" | "VARIABLE">(
    editing?.kind ?? "VARIABLE",
  );
  const [note, setNote] = React.useState(editing?.note ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !business.trim() || amount === "" || !categoryId) {
      toast.error(t.common.noData);
      return;
    }
    const input: TransactionInput = {
      date: date.toISOString(),
      businessName: business.trim(),
      amount: Number(amount),
      categoryId,
      kind,
      note: note.trim() || null,
    };
    startTransition(async () => {
      if (editing) await updateTransaction(editing.id, input);
      else await createTransaction(input);
      toast.success(t.common.save);
      onClose();
    });
  }

  const options = React.useMemo(() => {
    const opts: AutocompleteOption[] = categories
      .filter((c) => !c.archived)
      .map((c) => ({ value: c.id, label: c.name }));
    if (editing) {
      const current = categories.find((c) => c.id === editing.categoryId);
      if (current?.archived) {
        opts.push({
          value: current.id,
          label: current.name,
          hint: t.common.archived,
        });
      }
    }
    return opts;
  }, [categories, editing, t]);

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={editing ? t.transactions.edit : t.transactions.add}
      onSubmit={submit}
      pending={pending}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label={t.transactions.date} required>
          <DatePicker value={date} onChange={setDate} />
        </Field>
        <Field label={t.common.amount} required>
          <MoneyInput value={amount} onValueChange={setAmount} />
        </Field>
      </div>
      <Field label={t.transactions.business} htmlFor="tx-biz" required>
        <Input
          id="tx-biz"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
          required
        />
      </Field>
      <Field label={t.common.category} required>
        <Autocomplete
          options={options}
          value={categoryId}
          onChange={setCategoryId}
          placeholder={t.common.category}
        />
      </Field>
      <Field label={t.transactions.kind}>
        <Select
          value={kind}
          onValueChange={(v) => setKind(v as "FIXED" | "VARIABLE")}
          options={[
            { value: "VARIABLE", label: t.transactions.variable },
            { value: "FIXED", label: t.transactions.fixed },
          ]}
        />
      </Field>
      <Field label={t.transactions.note} htmlFor="tx-note">
        <Input
          id="tx-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
    </FormDialog>
  );
}
