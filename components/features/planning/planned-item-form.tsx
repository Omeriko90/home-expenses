"use client";

import { useMemo, useTransition } from "react";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import {
  createPlannedItem,
  updatePlannedItem,
  type PlannedItemInput,
} from "@/app/actions/planned-items";
import {
  createPlannedItemFormSchema,
  type PlannedItemFormValues,
} from "@/lib/schemas/planned-items";
import { formatMoney } from "@/lib/utils";
import { EndSelections } from "@/lib/schemas/common";
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { RhfFormDialog } from "@/components/ui/form/form-dialog";
import { TextField } from "@/components/ui/form/text-field";
import { MoneyField } from "@/components/ui/form/money-field";
import { NumberField } from "@/components/ui/form/number-field";
import { SelectField } from "@/components/ui/form/select-field";
import { MonthYearField } from "@/components/ui/form/month-year-field";
import {
  PlannedItemTypes,
  type ForecastItem,
  type PlanningCategory,
} from "./types";

const DURATION_PRESETS = [3, 6, 9, 12];

function initialEndSelection(editing: ForecastItem | null): string {
  if (!editing || editing.endYear == null || editing.endMonth == null)
    return EndSelections.None;
  const duration =
    editing.endYear * 12 +
    editing.endMonth -
    (editing.startYear * 12 + editing.startMonth) +
    1;
  return DURATION_PRESETS.includes(duration)
    ? String(duration)
    : EndSelections.Custom;
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
  const schema = useMemo(() => createPlannedItemFormSchema(t), [t]);
  const methods = useZodForm(schema, {
    defaultValues: {
      title: editing?.title ?? "",
      type: editing?.type ?? PlannedItemTypes.OneTime,
      amount: editing?.amount ?? undefined,
      installments: editing?.installments ?? undefined,
      start: {
        year: editing?.startYear ?? now.getFullYear(),
        month: editing?.startMonth ?? now.getMonth() + 1,
      },
      endSelection: initialEndSelection(editing),
      end: {
        year: editing?.endYear ?? now.getFullYear() + 1,
        month: editing?.endMonth ?? now.getMonth() + 1,
      },
      categoryId: editing?.categoryId ?? "",
      note: editing?.note ?? "",
    },
  });
  const type = useWatch({ control: methods.control, name: "type" });
  const amount = useWatch({ control: methods.control, name: "amount" });
  const installments = useWatch({
    control: methods.control,
    name: "installments",
  });
  const endSelection = useWatch({
    control: methods.control,
    name: "endSelection",
  });

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

  function resolveEnd(values: PlannedItemFormValues): {
    endYear: number | null;
    endMonth: number | null;
  } {
    if (values.type !== PlannedItemTypes.Recurring || values.endSelection === EndSelections.None)
      return { endYear: null, endMonth: null };
    if (values.endSelection === EndSelections.Custom)
      return { endYear: values.end.year, endMonth: values.end.month };
    const endIndex =
      values.start.year * 12 +
      (values.start.month - 1) +
      Number(values.endSelection) -
      1;
    return {
      endYear: Math.floor(endIndex / 12),
      endMonth: (endIndex % 12) + 1,
    };
  }

  function handleSubmit(values: PlannedItemFormValues) {
    const end = resolveEnd(values);
    const plannedItemInput: PlannedItemInput = {
      title: values.title,
      type: values.type,
      amount: values.amount,
      installments:
        values.type === PlannedItemTypes.Installments
          ? (values.installments ?? null)
          : null,
      startYear: values.start.year,
      startMonth: values.start.month,
      endYear: end.endYear,
      endMonth: end.endMonth,
      note: values.note.trim() || null,
      categoryId: values.categoryId || null,
    };
    startTransition(async () => {
      if (editing) await updatePlannedItem(editing.id, plannedItemInput);
      else await createPlannedItem(plannedItemInput);
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <RhfFormDialog
      open={open}
      onClose={onClose}
      title={editing ? t.planning.edit : t.planning.add}
      methods={methods}
      onSubmit={handleSubmit}
      pending={pending}
    >
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
            methods.setValue("installments", undefined);
            methods.clearErrors("installments");
          }
          if (value !== PlannedItemTypes.Recurring) {
            methods.clearErrors("end");
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
          {endSelection === EndSelections.Custom && <MonthYearField name="end" />}
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
    </RhfFormDialog>
  );
}
