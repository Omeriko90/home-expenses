"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field } from "@/components/shared/field";
import { MonthYearField as MonthYearInput } from "@/components/shared/month-year-field";

export function MonthDateField({
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
        const d = field.value instanceof Date ? field.value : new Date();
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
              year={d.getUTCFullYear()}
              month={d.getUTCMonth() + 1}
              onChange={(year, month) => {
                field.onChange(new Date(Date.UTC(year, month - 1, 1)));
                field.onBlur();
              }}
            />
          </Field>
        );
      }}
    />
  );
}
