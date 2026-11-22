"use client";

import * as React from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import {
  createPlannedItem,
  updatePlannedItem,
  type PlannedItemInput,
} from "@/app/actions/planned-items";
import { formatMoney } from "@/lib/utils";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { MoneyInput } from "@/components/shared/money-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select/Select";
import type { ForecastItem, PlanningCategory, PlannedItemType } from "./types";

export function PlannedItemForm({
  open,
  onClose,
  editing,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  editing: ForecastItem | null;
  categories: PlanningCategory[];
}) {
  const { t } = useI18n();
  const now = new Date();
  const [pending, startTransition] = React.useTransition();
  const [type, setType] = React.useState<PlannedItemType>(
    editing?.type ?? "ONE_TIME",
  );
  const [title, setTitle] = React.useState(editing?.title ?? "");
  const [amount, setAmount] = React.useState<number | "">(
    editing?.amount ?? "",
  );
  const [installments, setInstallments] = React.useState<number | "">(
    editing?.installments ?? "",
  );
  const [startYear, setStartYear] = React.useState(
    editing?.startYear ?? now.getFullYear(),
  );
  const [startMonth, setStartMonth] = React.useState(
    editing?.startMonth ?? now.getMonth() + 1,
  );
  const [hasEnd, setHasEnd] = React.useState(editing?.endYear != null);
  const [endYear, setEndYear] = React.useState(
    editing?.endYear ?? now.getFullYear() + 1,
  );
  const [endMonth, setEndMonth] = React.useState(
    editing?.endMonth ?? now.getMonth() + 1,
  );
  const [categoryId, setCategoryId] = React.useState(
    editing?.categoryId ?? "",
  );
  const [note, setNote] = React.useState(editing?.note ?? "");

  const amountLabel =
    type === "RECURRING"
      ? `${t.common.amount} (${t.common.monthly})`
      : type === "INSTALLMENTS"
        ? `${t.common.amount} (${t.common.total})`
        : t.common.amount;

  const perPayment =
    type === "INSTALLMENTS" &&
    typeof amount === "number" &&
    typeof installments === "number" &&
    installments > 0
      ? amount / installments
      : null;

  const monthOptions = t.months.map((m, i) => ({
    value: String(i + 1),
    label: m,
  }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || typeof amount !== "number" || amount <= 0) {
      toast.error(t.common.noData);
      return;
    }
    if (type === "INSTALLMENTS" && (typeof installments !== "number" || installments < 2)) {
      toast.error(t.planning.installmentsCount);
      return;
    }
    const input: PlannedItemInput = {
      title: title.trim(),
      type,
      amount,
      installments: type === "INSTALLMENTS" ? Number(installments) : null,
      startYear,
      startMonth,
      endYear: type === "RECURRING" && hasEnd ? endYear : null,
      endMonth: type === "RECURRING" && hasEnd ? endMonth : null,
      note: note.trim() || null,
      categoryId: categoryId || null,
    };
    startTransition(async () => {
      if (editing) await updatePlannedItem(editing.id, input);
      else await createPlannedItem(input);
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={editing ? t.planning.edit : t.planning.add}
      onSubmit={submit}
      pending={pending}
    >
      <Field label={t.common.name} htmlFor="p-title" required>
        <Input
          id="p-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </Field>

      <Field label={t.common.type}>
        <Select
          value={type}
          onValueChange={(v) => setType(v as PlannedItemType)}
          options={[
            { value: "ONE_TIME", label: t.planning.typeOneTime },
            { value: "RECURRING", label: t.planning.typeRecurring },
            { value: "INSTALLMENTS", label: t.planning.typeInstallments },
          ]}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={amountLabel} required>
          <MoneyInput value={amount} onValueChange={setAmount} />
        </Field>
        {type === "INSTALLMENTS" && (
          <Field
            label={t.planning.installmentsCount}
            htmlFor="p-installments"
            required
            hint={
              perPayment != null
                ? `${formatMoney(perPayment, { decimals: true })} ${t.planning.perPayment}`
                : undefined
            }
          >
            <Input
              id="p-installments"
              type="number"
              inputMode="numeric"
              min={2}
              max={120}
              value={installments}
              onChange={(e) =>
                setInstallments(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              required
            />
          </Field>
        )}
      </div>

      <Field label={t.planning.startMonth}>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={String(startMonth)}
            onValueChange={(v) => setStartMonth(Number(v))}
            options={monthOptions}
          />
          <Input
            type="number"
            inputMode="numeric"
            min={2000}
            max={2100}
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
            aria-label={t.common.year}
          />
        </div>
      </Field>

      {type === "RECURRING" && (
        <>
          <Field label={t.planning.endMonth}>
            <Select
              value={hasEnd ? "end" : "none"}
              onValueChange={(v) => setHasEnd(v === "end")}
              options={[
                { value: "none", label: t.planning.noEnd },
                { value: "end", label: t.planning.hasEnd },
              ]}
            />
          </Field>
          {hasEnd && (
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={String(endMonth)}
                onValueChange={(v) => setEndMonth(Number(v))}
                options={monthOptions}
              />
              <Input
                type="number"
                inputMode="numeric"
                min={2000}
                max={2100}
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                aria-label={t.common.year}
              />
            </div>
          )}
        </>
      )}

      <Field label={t.common.category}>
        <Select
          value={categoryId || null}
          onValueChange={setCategoryId}
          placeholder={t.common.none}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
      </Field>

      <Field label={t.transactions.note} htmlFor="p-note">
        <Input
          id="p-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
    </FormDialog>
  );
}
