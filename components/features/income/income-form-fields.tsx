"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { useI18n } from "@/lib/i18n/context";
import { EndSelections } from "@/lib/schemas/common";
import { TextField } from "@/components/ui/form/text-field";
import { MoneyField } from "@/components/ui/form/money-field";
import { SelectField } from "@/components/ui/form/select-field";
import { MonthYearField } from "@/components/ui/form/month-year-field";
import { IncomeType } from "./types";

export function IncomeFormFields({ isEditing }: { isEditing: boolean }) {
  const { t } = useI18n();
  const { control, setValue, clearErrors } = useFormContext();
  const type = useWatch({ control, name: "type" });
  const hasEnd = useWatch({ control, name: "hasEnd" });

  return (
    <>
      {!isEditing && (
        <SelectField
          name="type"
          label={t.common.type}
          options={[
            { value: IncomeType.Fixed, label: t.income.typeFixed },
            { value: IncomeType.OneTime, label: t.income.typeOneTime },
          ]}
          onValueChange={(value) => {
            if (value !== IncomeType.Fixed) {
              setValue("hasEnd", EndSelections.None);
              clearErrors("end");
            }
          }}
        />
      )}

      <TextField
        name="name"
        label={t.common.name}
        placeholder={t.income.nameHint}
        required
      />

      <MoneyField name="amount" label={t.common.amount} required />

      <MonthYearField
        name="start"
        label={type === IncomeType.Fixed ? t.income.startMonth : t.common.month}
      />

      {type === IncomeType.Fixed && !isEditing && (
        <>
          <SelectField
            name="hasEnd"
            label={t.income.endMonth}
            options={[
              { value: EndSelections.None, label: t.income.noEnd },
              { value: EndSelections.Custom, label: t.income.pickEndMonth },
            ]}
          />
          {hasEnd === EndSelections.Custom && <MonthYearField name="end" />}
          <p className="text-sm text-muted-foreground">{t.income.fixedHint}</p>
        </>
      )}

      <TextField name="note" label={t.transactions.note} />
    </>
  );
}
