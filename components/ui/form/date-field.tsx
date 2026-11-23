"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field } from "@/components/shared/field";
import { DatePicker } from "@/components/shared/date-picker";

export function DateField({
  name,
  label,
  required,
  hint,
  placeholder,
  className,
  pickerClassName,
}: {
  name: string;
  label?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  className?: string;
  pickerClassName?: string;
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field
          label={label}
          htmlFor={name}
          required={required}
          hint={hint}
          error={fieldState.error?.message}
          className={className}
        >
          <DatePicker
            id={name}
            value={field.value instanceof Date ? field.value : undefined}
            onChange={(d) => field.onChange(d)}
            placeholder={placeholder}
            className={pickerClassName}
          />
        </Field>
      )}
    />
  );
}
