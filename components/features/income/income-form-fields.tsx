"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { useI18n } from "@/lib/i18n/context";
import { EndSelections } from "@/lib/schemas/common";
import { TextField } from "@/components/ui/form/text-field";
import { MoneyField } from "@/components/ui/form/money-field";
import { NumberField } from "@/components/ui/form/number-field";
import { SelectField } from "@/components/ui/form/select-field";
import { MonthYearField } from "@/components/ui/form/month-year-field";
import { TaxBreakdownPreview } from "./tax-breakdown-preview";
import {
  AmountTypes,
  IncomeType,
  type IncomeEntryData,
  type IncomeSourceData,
} from "./types";

export function IncomeFormFields({
  isEditing,
  sources,
  entries,
}: {
  isEditing: boolean;
  sources: IncomeSourceData[];
  entries: IncomeEntryData[];
}) {
  const { t } = useI18n();
  const { control, setValue, clearErrors } = useFormContext();
  const type = useWatch({ control, name: "type" });
  const hasEnd = useWatch({ control, name: "hasEnd" });
  const amountType = useWatch({ control, name: "amountType" });
  const grossSources = sources.filter(
    (source) => source.amountType === AmountTypes.Gross,
  );

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

      <div className="grid grid-cols-2 gap-3">
        <MoneyField name="amount" label={t.common.amount} required />
        <SelectField
          name="amountType"
          label={t.income.amountType}
          options={[
            { value: AmountTypes.Net, label: t.income.net },
            { value: AmountTypes.Gross, label: t.income.gross },
          ]}
        />
      </div>

      <MonthYearField
        name="start"
        label={type === IncomeType.Fixed ? t.income.startMonth : t.common.month}
      />

      {amountType === AmountTypes.Gross && type === IncomeType.Fixed && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <NumberField
              name="creditPoints"
              label={t.income.creditPoints}
              min={0}
              max={20}
            />
            <NumberField
              name="pensionPercent"
              label={t.income.pensionPercent}
              min={0}
              max={20}
            />
            <NumberField
              name="hishtalmutPercent"
              label={t.income.hishtalmutPercent}
              min={0}
              max={20}
            />
          </div>
          <p className="text-sm text-muted-foreground">{t.income.grossHint}</p>
        </>
      )}

      {amountType === AmountTypes.Gross && type === IncomeType.OneTime && (
        <SelectField
          name="linkedSourceId"
          label={t.income.linkedSource}
          hint={t.income.linkedBonusHint}
          options={[
            { value: "", label: t.income.standaloneBonus },
            ...grossSources.map((source) => ({
              value: source.id,
              label: source.name,
            })),
          ]}
        />
      )}

      {amountType === AmountTypes.Gross && (
        <TaxBreakdownPreview sources={sources} entries={entries} />
      )}

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
