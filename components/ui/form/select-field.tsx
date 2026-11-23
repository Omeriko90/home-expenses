"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field } from "@/components/shared/field";
import { Select, type SelectOption } from "@/components/ui/select/Select";

export function SelectField({
  name,
  label,
  options,
  required,
  hint,
  placeholder,
  disabled,
  className,
  selectClassName,
  onValueChange,
}: {
  name: string;
  label?: string;
  options: SelectOption[];
  required?: boolean;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  selectClassName?: string;
  /** Extra callback for dependent-field logic; form state is updated regardless. */
  onValueChange?: (value: string) => void;
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
          <Select
            value={typeof field.value === "string" ? field.value : undefined}
            onValueChange={(value) => {
              field.onChange(value);
              field.onBlur();
              onValueChange?.(value);
            }}
            options={options}
            placeholder={placeholder}
            disabled={disabled}
            className={selectClassName}
          />
        </Field>
      )}
    />
  );
}
