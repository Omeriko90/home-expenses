"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field } from "@/components/shared/field";
import { MonthYearField as MonthYearInput } from "@/components/shared/month-year-field";
import type { MonthYear } from "@/lib/schemas/common";

export function MonthYearField({
  name,
  label,
  required,
  hint,
  className,
}: {
  name: string;
  label?: string;
  required?: boolean;
  hint?: string;
  className?: string;
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const value = field.value as MonthYear;
        return (
          <Field
            label={label}
            htmlFor={name}
            required={required}
            hint={hint}
            error={fieldState.error?.message}
            className={className}
          >
            <MonthYearInput
              id={name}
              year={value.year}
              month={value.month}
              onChange={(year, month) => {
                field.onChange({ year, month });
                field.onBlur();
              }}
            />
          </Field>
        );
      }}
    />
  );
}
