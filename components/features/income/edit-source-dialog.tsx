"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import {
  addRaise,
  endIncomeSource,
  reactivateIncomeSource,
  renameIncomeSource,
  setMonthOverride,
} from "@/app/actions/income";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { MoneyInput } from "@/components/shared/money-input";
import { MonthYearField } from "@/components/shared/month-year-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select/Select";
import type { IncomeSourceData } from "./types";

type ApplyMode = "month" | "permanent";

export function EditSourceDialog({
  source,
  currentAmount,
  year,
  month,
  onClose,
}: {
  source: IncomeSourceData;
  /** Resolved amount for the selected month; null when inactive there. */
  currentAmount: number | null;
  year: number;
  month: number;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(source.name);
  const [amount, setAmount] = useState<number | "">(currentAmount ?? "");
  const [applyMode, setApplyMode] = useState<ApplyMode>("permanent");
  const [fromYear, setFromYear] = useState(year);
  const [fromMonth, setFromMonth] = useState(month);
  const [hasEnd, setHasEnd] = useState(source.endYear !== null);
  const [endYear, setEndYear] = useState(source.endYear ?? year);
  const [endMonth, setEndMonth] = useState(source.endMonth ?? month);

  const amountChanged =
    typeof amount === "number" && amount !== currentAmount;
  const endChanged =
    hasEnd !== (source.endYear !== null) ||
    (hasEnd &&
      (endYear !== source.endYear || endMonth !== source.endMonth));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || typeof amount !== "number") {
      toast.error(t.common.noData);
      return;
    }
    startTransition(async () => {
      if (name.trim() !== source.name) {
        const result = await renameIncomeSource(source.id, name.trim());
        if ("error" in result) {
          toast.error(
            result.error === "duplicateName"
              ? t.income.duplicate
              : t.common.noData,
          );
          return;
        }
      }
      if (amountChanged) {
        if (applyMode === "month") {
          await setMonthOverride(source.id, { year, month, amount, note: null });
        } else {
          await addRaise(source.id, {
            year: fromYear,
            month: fromMonth,
            amount,
            note: null,
          });
        }
      }
      if (endChanged) {
        if (hasEnd) {
          await endIncomeSource(source.id, { year: endYear, month: endMonth });
        } else {
          await reactivateIncomeSource(source.id);
        }
      }
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <FormDialog
      open
      onClose={onClose}
      title={`${t.income.edit} — ${source.name}`}
      onSubmit={handleSubmit}
      pending={pending}
    >
      <Field label={t.common.name} htmlFor="edit-source-name" required>
        <Input
          id="edit-source-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </Field>

      <Field label={t.common.amount} required>
        <MoneyInput value={amount} onValueChange={setAmount} />
      </Field>

      {amountChanged && (
        <>
          <Field label={t.income.amountApply}>
            <Select
              value={applyMode}
              onValueChange={(v) => setApplyMode(v as ApplyMode)}
              options={[
                { value: "permanent", label: t.income.applyPermanent },
                { value: "month", label: t.income.applyThisMonth },
              ]}
            />
          </Field>
          {applyMode === "permanent" && (
            <>
              <Field label={t.income.startMonth} htmlFor="edit-source-from">
                <MonthYearField
                  id="edit-source-from"
                  year={fromYear}
                  month={fromMonth}
                  onChange={(y, m) => {
                    setFromYear(y);
                    setFromMonth(m);
                  }}
                />
              </Field>
              <p className="text-sm text-muted-foreground">
                {t.income.raiseHint}
              </p>
            </>
          )}
        </>
      )}

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
            <>
              <MonthYearField
                year={endYear}
                month={endMonth}
                onChange={(y, m) => {
                  setEndYear(y);
                  setEndMonth(m);
                }}
              />
              <p className="text-sm text-muted-foreground">
                {t.income.endHint}
              </p>
            </>
          )}
        </div>
      </Field>
    </FormDialog>
  );
}
