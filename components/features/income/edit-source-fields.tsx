"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { useI18n } from "@/lib/i18n/context";
import { ApplyModes } from "@/lib/schemas/income";
import { EndSelections } from "@/lib/schemas/common";
import { TextField } from "@/components/ui/form/text-field";
import { MoneyField } from "@/components/ui/form/money-field";
import { SelectField } from "@/components/ui/form/select-field";
import { MonthYearField } from "@/components/ui/form/month-year-field";

export function EditSourceFields({
  currentAmount,
}: {
  currentAmount: number | null;
}) {
  const { t } = useI18n();
  const { control } = useFormContext();
  const amount = useWatch({ control, name: "amount" });
  const applyMode = useWatch({ control, name: "applyMode" });
  const hasEnd = useWatch({ control, name: "hasEnd" });
  const amountChanged = typeof amount === "number" && amount !== currentAmount;

  return (
    <>
      <TextField name="name" label={t.common.name} required />

      <MoneyField name="amount" label={t.common.amount} required />

      {amountChanged && (
        <>
          <SelectField
            name="applyMode"
            label={t.income.amountApply}
            options={[
              { value: ApplyModes.Permanent, label: t.income.applyPermanent },
              { value: ApplyModes.Month, label: t.income.applyThisMonth },
            ]}
          />
          {applyMode === ApplyModes.Permanent && (
            <>
              <MonthYearField name="from" label={t.income.startMonth} />
              <p className="text-sm text-muted-foreground">
                {t.income.raiseHint}
              </p>
            </>
          )}
        </>
      )}

      <SelectField
        name="hasEnd"
        label={t.income.endMonth}
        options={[
          { value: EndSelections.None, label: t.income.noEnd },
          { value: EndSelections.Custom, label: t.income.pickEndMonth },
        ]}
      />
      {hasEnd === EndSelections.Custom && (
        <>
          <MonthYearField name="end" />
          <p className="text-sm text-muted-foreground">{t.income.endHint}</p>
        </>
      )}
    </>
  );
}
