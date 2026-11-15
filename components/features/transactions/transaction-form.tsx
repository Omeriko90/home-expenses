"use client";

import * as React from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import {
  createTransaction,
  updateTransaction,
  type TransactionInput,
} from "@/app/actions/transactions";
import { Field } from "@/components/shared/field";
import { MoneyInput } from "@/components/shared/money-input";
import { DatePicker } from "@/components/shared/date-picker";
import { Autocomplete } from "@/components/shared/autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type TxCategory = {
  id: string;
  name: string;
  type: "EXPENSE" | "INVESTMENT";
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
  onOpenChange,
  editing,
  categories,
  year,
  month,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: TxRow | null;
  categories: TxCategory[];
  year: number;
  month: number;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = React.useTransition();
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [business, setBusiness] = React.useState("");
  const [amount, setAmount] = React.useState<number | "">("");
  const [categoryId, setCategoryId] = React.useState<string | null>(null);
  const [kind, setKind] = React.useState<"FIXED" | "VARIABLE">("VARIABLE");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setDate(new Date(editing.date));
      setBusiness(editing.businessName);
      setAmount(editing.amount);
      setCategoryId(editing.categoryId);
      setKind(editing.kind);
      setNote(editing.note ?? "");
    } else {
      setDate(new Date(Date.UTC(year, month - 1, 1)));
      setBusiness("");
      setAmount("");
      setCategoryId(null);
      setKind("VARIABLE");
      setNote("");
    }
  }, [open, editing, year, month]);

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
      onOpenChange(false);
    });
  }

  const options = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? t.transactions.edit : t.transactions.add}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
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
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VARIABLE">{t.transactions.variable}</SelectItem>
                <SelectItem value="FIXED">{t.transactions.fixed}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t.transactions.note} htmlFor="tx-note">
            <Input
              id="tx-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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
