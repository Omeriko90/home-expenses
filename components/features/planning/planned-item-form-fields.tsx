"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import { EndSelections } from "@/lib/schemas/common";
import { TextField } from "@/components/ui/form/text-field";
import { MoneyField } from "@/components/ui/form/money-field";
import { NumberField } from "@/components/ui/form/number-field";
import { SelectField } from "@/components/ui/form/select-field";
import { MonthYearField } from "@/components/ui/form/month-year-field";
import {
  DURATION_PRESETS,
  PlannedItemTypes,
  type PlanningCategory,
} from "./types";

export function PlannedItemFormFields({
  categories,
}: {
  categories: PlanningCategory[];
}) {
  const { t } = useI18n();
  const { control, setValue, clearErrors } = useFormContext();
  const type = useWatch({ control, name: "type" });
  const amount = useWatch({ control, name: "amount" });
  const installments = useWatch({ control, name: "installments" });
  const endSelection = useWatch({ control, name: "endSelection" });

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

  return (
    <>
      <TextField name="title" label={t.common.name} required />

      <SelectField
        name="type"
        label={t.common.type}
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
        onValueChange={(value) => {
          if (value !== PlannedItemTypes.Installments) {
            setValue("installments", undefined);
            clearErrors("installments");
          }
          if (value !== PlannedItemTypes.Recurring) {
            clearErrors("end");
          }
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <MoneyField name="amount" label={amountLabel} required />
        {type === PlannedItemTypes.Installments && (
          <NumberField
            name="installments"
            label={t.planning.installmentsCount}
            required
            min={2}
            max={120}
            hint={
              perPayment != null
                ? `${formatMoney(perPayment, { decimals: true })} ${t.planning.perPayment}`
                : undefined
            }
          />
        )}
      </div>

      <MonthYearField name="start" label={t.planning.startMonth} />

      {type === PlannedItemTypes.Recurring && (
        <>
          <SelectField
            name="endSelection"
            label={t.planning.endMonth}
            options={[
              { value: EndSelections.None, label: t.planning.noEnd },
              ...DURATION_PRESETS.map((months) => ({
                value: String(months),
                label: t.planning.monthsCount.replace("{n}", String(months)),
              })),
              { value: EndSelections.Custom, label: t.planning.durationCustom },
            ]}
          />
          {endSelection === EndSelections.Custom && (
            <MonthYearField name="end" />
          )}
        </>
      )}

      <SelectField
        name="categoryId"
        label={t.common.category}
        placeholder={t.common.none}
        options={categories.map((category) => ({
          value: category.id,
          label: category.name,
        }))}
      />

      <TextField name="note" label={t.transactions.note} />
    </>
  );
}
