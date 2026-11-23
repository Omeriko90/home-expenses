"use client";

import { useState, useTransition, type FormEvent } from "react";
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
import { MonthYearField } from "./month-year-field";
import {
  PlannedItemTypes,
  type ForecastItem,
  type PlanningCategory,
  type PlannedItemType,
} from "./types";

const DURATION_PRESETS = [3, 6, 9, 12];

function initialEndSelection(editing: ForecastItem | null): string {
  if (!editing || editing.endYear == null || editing.endMonth == null)
    return "none";
  const duration =
    editing.endYear * 12 +
    editing.endMonth -
    (editing.startYear * 12 + editing.startMonth) +
    1;
  return DURATION_PRESETS.includes(duration) ? String(duration) : "custom";
}

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
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<PlannedItemType>(
    editing?.type ?? PlannedItemTypes.OneTime,
  );
  const [title, setTitle] = useState(editing?.title ?? "");
  const [amount, setAmount] = useState<number | "">(editing?.amount ?? "");
  const [installments, setInstallments] = useState<number | "">(
    editing?.installments ?? "",
  );
  const [startYear, setStartYear] = useState(
    editing?.startYear ?? now.getFullYear(),
  );
  const [startMonth, setStartMonth] = useState(
    editing?.startMonth ?? now.getMonth() + 1,
  );
  const [endSelection, setEndSelection] = useState(() =>
    initialEndSelection(editing),
  );
  const [endYear, setEndYear] = useState(
    editing?.endYear ?? now.getFullYear() + 1,
  );
  const [endMonth, setEndMonth] = useState(
    editing?.endMonth ?? now.getMonth() + 1,
  );
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? "");
  const [note, setNote] = useState(editing?.note ?? "");

  const amountLabel =
    type === PlannedItemTypes.Recurring
      ? `${t.common.amount} (${t.common.monthly})`
      : type === PlannedItemTypes.Installments
        ? `${t.common.amount} (${t.common.total})`
        : t.common.amount;

  const perPayment =
    type === PlannedItemTypes.Installments &&
    typeof amount === "number" &&
    typeof installments === "number" &&
    installments > 0
      ? amount / installments
      : null;

  function resolveEnd(): { endYear: number | null; endMonth: number | null } {
    if (type !== PlannedItemTypes.Recurring || endSelection === "none")
      return { endYear: null, endMonth: null };
    if (endSelection === "custom") return { endYear, endMonth };
    const endIndex = startYear * 12 + (startMonth - 1) + Number(endSelection) - 1;
    return { endYear: Math.floor(endIndex / 12), endMonth: (endIndex % 12) + 1 };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || typeof amount !== "number" || amount <= 0) {
      toast.error(t.common.noData);
      return;
    }
    if (
      type === PlannedItemTypes.Installments &&
      (typeof installments !== "number" || installments < 2)
    ) {
      toast.error(t.planning.installmentsCount);
      return;
    }
    const end = resolveEnd();
    const plannedItemInput: PlannedItemInput = {
      title: title.trim(),
      type,
      amount,
      installments:
        type === PlannedItemTypes.Installments ? Number(installments) : null,
      startYear,
      startMonth,
      endYear: end.endYear,
      endMonth: end.endMonth,
      note: note.trim() || null,
      categoryId: categoryId || null,
    };
    startTransition(async () => {
      if (editing) await updatePlannedItem(editing.id, plannedItemInput);
      else await createPlannedItem(plannedItemInput);
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={editing ? t.planning.edit : t.planning.add}
      onSubmit={handleSubmit}
      pending={pending}
    >
      <Field label={t.common.name} htmlFor="p-title" required>
        <Input
          id="p-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </Field>

      <Field label={t.common.type}>
        <Select
          value={type}
          onValueChange={(value) => setType(value as PlannedItemType)}
          options={[
            { value: PlannedItemTypes.OneTime, label: t.planning.typeOneTime },
            {
              value: PlannedItemTypes.Recurring,
              label: t.planning.typeRecurring,
            },
            {
              value: PlannedItemTypes.Installments,
              label: t.planning.typeInstallments,
            },
          ]}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={amountLabel} required>
          <MoneyInput value={amount} onValueChange={setAmount} />
        </Field>
        {type === PlannedItemTypes.Installments && (
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
              onChange={(event) =>
                setInstallments(
                  event.target.value === "" ? "" : Number(event.target.value),
                )
              }
              required
            />
          </Field>
        )}
      </div>

      <Field label={t.planning.startMonth} htmlFor="p-start">
        <MonthYearField
          id="p-start"
          year={startYear}
          month={startMonth}
          onChange={(year, month) => {
            setStartYear(year);
            setStartMonth(month);
          }}
        />
      </Field>

      {type === PlannedItemTypes.Recurring && (
        <>
          <Field label={t.planning.endMonth}>
            <Select
              value={endSelection}
              onValueChange={setEndSelection}
              options={[
                { value: "none", label: t.planning.noEnd },
                ...DURATION_PRESETS.map((months) => ({
                  value: String(months),
                  label: t.planning.monthsCount.replace("{n}", String(months)),
                })),
                { value: "custom", label: t.planning.durationCustom },
              ]}
            />
          </Field>
          {endSelection === "custom" && (
            <MonthYearField
              year={endYear}
              month={endMonth}
              onChange={(year, month) => {
                setEndYear(year);
                setEndMonth(month);
              }}
            />
          )}
        </>
      )}

      <Field label={t.common.category}>
        <Select
          value={categoryId || null}
          onValueChange={setCategoryId}
          placeholder={t.common.none}
          options={categories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
        />
      </Field>

      <Field label={t.transactions.note} htmlFor="p-note">
        <Input
          id="p-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>
    </FormDialog>
  );
}
