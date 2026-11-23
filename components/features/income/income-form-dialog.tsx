"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import {
  createIncomeSource,
  createOneTimeIncome,
  updateOneTimeIncome,
} from "@/app/actions/income";
import { monthKey } from "@/lib/income-resolve";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { MoneyInput } from "@/components/shared/money-input";
import { MonthYearField } from "@/components/shared/month-year-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select/Select";
import {
  IncomeType,
  type IncomeEntryData,
  type IncomeTypeValue,
} from "./types";

export function IncomeFormDialog({
  onClose,
  defaultYear,
  defaultMonth,
  editingOneTime,
}: {
  onClose: () => void;
  defaultYear: number;
  defaultMonth: number;
  editingOneTime?: IncomeEntryData | null;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  const [type, setType] = useState<IncomeTypeValue>(
    editingOneTime ? IncomeType.OneTime : IncomeType.Fixed,
  );
  const [name, setName] = useState(editingOneTime?.name ?? "");
  const [amount, setAmount] = useState<number | "">(
    editingOneTime?.amount ?? "",
  );
  const [year, setYear] = useState(
    editingOneTime?.year ?? defaultYear,
  );
  const [month, setMonth] = useState(
    editingOneTime?.month ?? defaultMonth,
  );
  const [hasEnd, setHasEnd] = useState(false);
  const [endYear, setEndYear] = useState(defaultYear);
  const [endMonth, setEndMonth] = useState(defaultMonth);
  const [note, setNote] = useState(editingOneTime?.note ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || typeof amount !== "number") {
      toast.error(t.common.noData);
      return;
    }
    const withEnd = type === IncomeType.Fixed && !editingOneTime && hasEnd;
    if (withEnd && monthKey(endYear, endMonth) < monthKey(year, month)) {
      toast.error(t.income.endBeforeStart);
      return;
    }
    const input = {
      name: name.trim(),
      amount,
      year,
      month,
      note: note.trim() || null,
    };
    startTransition(async () => {
      const result = editingOneTime
        ? await updateOneTimeIncome(editingOneTime.id, input)
        : type === IncomeType.Fixed
          ? await createIncomeSource({
              ...input,
              endYear: withEnd ? endYear : null,
              endMonth: withEnd ? endMonth : null,
            })
          : await createOneTimeIncome(input);
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
    <FormDialog
      open
      onClose={onClose}
      title={editingOneTime ? t.income.edit : t.income.add}
      onSubmit={handleSubmit}
      pending={pending}
    >
      {!editingOneTime && (
        <Field label={t.common.type}>
          <Select
            value={type}
            onValueChange={(v) => setType(v as IncomeTypeValue)}
            options={[
              { value: IncomeType.Fixed, label: t.income.typeFixed },
              { value: IncomeType.OneTime, label: t.income.typeOneTime },
            ]}
          />
        </Field>
      )}

      <Field label={t.common.name} htmlFor="income-name" required>
        <Input
          id="income-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.income.nameHint}
          required
        />
      </Field>

      <Field label={t.common.amount} required>
        <MoneyInput value={amount} onValueChange={setAmount} />
      </Field>

      <Field
        label={type === IncomeType.Fixed ? t.income.startMonth : t.common.month}
        htmlFor="income-ym"
      >
        <MonthYearField
          id="income-ym"
          year={year}
          month={month}
          onChange={(y, m) => {
            setYear(y);
            setMonth(m);
          }}
        />
      </Field>

      {type === IncomeType.Fixed && !editingOneTime && (
        <>
          <Field label={t.income.endMonth}>
            <div className="flex flex-col gap-2">
              <Select
                value={hasEnd ? "custom" : "none"}
                onValueChange={(v) => setHasEnd(v === "custom")}
                options={[
                  { value: "none", label: t.income.noEnd },
                  { value: "custom", label: t.income.pickEndMonth },
                ]}
              />
              {hasEnd && (
                <MonthYearField
                  year={endYear}
                  month={endMonth}
                  onChange={(y, m) => {
                    setEndYear(y);
                    setEndMonth(m);
                  }}
                />
              )}
            </div>
          </Field>
          <p className="text-sm text-muted-foreground">{t.income.fixedHint}</p>
        </>
      )}

      <Field label={t.transactions.note} htmlFor="income-note">
        <Input
          id="income-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
    </FormDialog>
  );
}
