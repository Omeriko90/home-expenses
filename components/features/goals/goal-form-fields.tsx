"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { useI18n } from "@/lib/i18n/context";
import { GoalTypes, GoalLinkKinds } from "@/lib/schemas/goals";
import { TextField } from "@/components/ui/form/text-field";
import { TextareaField } from "@/components/ui/form/textarea-field";
import { MoneyField } from "@/components/ui/form/money-field";
import { SelectField } from "@/components/ui/form/select-field";
import type { GoalCategory } from "./types";

export function GoalFormFields({
  isEditing,
  categories,
}: {
  isEditing: boolean;
  categories: GoalCategory[];
}) {
  const { t } = useI18n();
  const { control, clearErrors } = useFormContext();
  const type = useWatch({ control, name: "type" });
  const linkKind = useWatch({ control, name: "linkKind" });

  return (
    <>
      <TextField name="title" label={t.common.name} required />

      {!isEditing && (
        <SelectField
          name="type"
          label={t.common.type}
          options={[
            { value: GoalTypes.Numeric, label: t.goals.numeric },
            { value: GoalTypes.Checklist, label: t.goals.checklist },
          ]}
          onValueChange={() => clearErrors()}
        />
      )}

      {type === GoalTypes.Numeric ? (
        <>
          <SelectField
            name="linkKind"
            label={t.goals.linkTo}
            options={[
              { value: GoalLinkKinds.None, label: t.goals.linkNone },
              { value: GoalLinkKinds.Category, label: t.goals.linkCategory },
              {
                value: GoalLinkKinds.InvestmentTotal,
                label: t.goals.linkInvestment,
              },
            ]}
          />
          {linkKind === GoalLinkKinds.Category && (
            <SelectField
              name="linkCategoryId"
              label={t.goals.linkCategory}
              placeholder={t.common.category}
              options={categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <MoneyField name="target" label={t.goals.target} required />
            {linkKind === GoalLinkKinds.None && (
              <MoneyField name="current" label={t.goals.current} />
            )}
          </div>
        </>
      ) : (
        <TextareaField
          name="milestonesText"
          label={t.goals.milestone}
          hint={t.goals.addMilestone}
          rows={4}
        />
      )}

      <TextField name="note" label={t.transactions.note} />
    </>
  );
}
