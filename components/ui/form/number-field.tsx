"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";

export function NumberField({
  name,
  label,
  required,
  hint,
  placeholder,
  disabled,
  min,
  max,
  className,
  inputClassName,
}: {
  name: string;
  label?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
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
          <Input
            id={name}
            ref={field.ref}
            type="number"
            inputMode="numeric"
            value={typeof field.value === "number" ? field.value : ""}
            onChange={(event) =>
              field.onChange(
                event.target.value === "" ? undefined : Number(event.target.value),
              )
            }
            onBlur={field.onBlur}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            aria-invalid={!!fieldState.error}
            className={inputClassName}
          />
        </Field>
      )}
    />
  );
}
