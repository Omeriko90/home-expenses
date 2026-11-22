"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field } from "@/components/shared/field";
import { MoneyInput } from "@/components/shared/money-input";

export function MoneyField({
  name,
  label,
  required,
  hint,
  placeholder,
  disabled,
  className,
  inputClassName,
}: {
  name: string;
  label?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
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
          <MoneyInput
            id={name}
            ref={field.ref}
            value={typeof field.value === "number" ? field.value : ""}
            onValueChange={(v) => field.onChange(v === "" ? undefined : v)}
            onBlur={field.onBlur}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={!!fieldState.error}
            className={inputClassName}
          />
        </Field>
      )}
    />
  );
}
