"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { createTransaction, updateTransaction } from "@/app/actions/transactions";
import { createDeposit, updateDeposit } from "@/app/actions/investments";
import {
  createTransactionFormSchema,
  TransactionKinds,
  type TransactionFormValues,
} from "@/lib/schemas/transactions";
import type { AutocompleteOption } from "@/components/shared/autocomplete";
import { FormDialog } from "@/components/ui/form/form-dialog";
import { TextField } from "@/components/ui/form/text-field";
import { MoneyField } from "@/components/ui/form/money-field";
import { DateField } from "@/components/ui/form/date-field";
import { SelectField } from "@/components/ui/form/select-field";
import { AutocompleteField } from "@/components/ui/form/autocomplete-field";

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
  mode = "transaction",
  portfolioId,
}: {
  open: boolean;
  onClose: () => void;
  editing: TxRow | null;
  categories: TxCategory[];
  year: number;
  month: number;
  mode?: "transaction" | "deposit";
  portfolioId?: string;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const schema = useMemo(() => createTransactionFormSchema(t), [t]);
  const isDeposit = mode === "deposit";

  function handleSubmit(values: TransactionFormValues) {
    startTransition(async () => {
      const input = {
        date: values.date.toISOString(),
        businessName: values.businessName,
        amount: values.amount,
        categoryId: values.categoryId,
        kind: values.kind,
        note: values.note.trim() || null,
      };
      if (isDeposit && portfolioId) {
        if (editing) await updateDeposit(editing.id, input);
        else await createDeposit(portfolioId, input);
      } else if (editing) {
        await updateTransaction(editing.id, input);
      } else {
        await createTransaction(input);
      }
      toast.success(t.common.save);
      onClose();
    });
  }

  const options = useMemo(() => {
    const opts: AutocompleteOption[] = categories
      .filter((category) => !category.archived)
      .map((category) => ({ value: category.id, label: category.name }));
    if (editing) {
      const current = categories.find((category) => category.id === editing.categoryId);
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
      title={
        isDeposit
          ? editing
            ? t.investments.editDeposit
            : t.investments.addDeposit
          : editing
            ? t.transactions.edit
            : t.transactions.add
      }
      schema={schema}
      defaultValues={{
        date: editing
          ? new Date(editing.date)
          : new Date(Date.UTC(year, month - 1, 1)),
        businessName: editing?.businessName ?? "",
        amount: editing?.amount ?? undefined,
        categoryId: editing?.categoryId ?? "",
        kind: editing?.kind ?? TransactionKinds.Variable,
        note: editing?.note ?? "",
      }}
      onSubmit={handleSubmit}
      pending={pending}
    >
      <div className="grid grid-cols-2 gap-4">
        <DateField name="date" label={t.transactions.date} required />
        <MoneyField name="amount" label={t.common.amount} required />
      </div>
      <TextField
        name="businessName"
        label={isDeposit ? t.investments.depositSource : t.transactions.business}
        required
      />
      <AutocompleteField
        name="categoryId"
        label={t.common.category}
        options={options}
        placeholder={t.common.category}
        required
      />
      {!isDeposit && (
        <SelectField
          name="kind"
          label={t.transactions.kind}
          options={[
            {
              value: TransactionKinds.Variable,
              label: t.transactions.variable,
            },
            { value: TransactionKinds.Fixed, label: t.transactions.fixed },
          ]}
        />
      )}
      <TextField name="note" label={t.transactions.note} />
    </FormDialog>
  );
}
