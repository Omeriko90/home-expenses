"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field } from "@/components/shared/field";
import {
  Autocomplete,
  type AutocompleteOption,
} from "@/components/shared/autocomplete";

export function AutocompleteField({
  name,
  label,
  options,
  required,
  hint,
  placeholder,
  searchPlaceholder,
  emptyText,
  customValueLabel,
  disabled,
  className,
  triggerClassName,
}: {
  name: string;
  label?: string;
  options: AutocompleteOption[];
  required?: boolean;
  hint?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  customValueLabel?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
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
          <Autocomplete
            id={name}
            options={options}
            value={typeof field.value === "string" ? field.value : null}
            onChange={field.onChange}
            placeholder={placeholder}
            searchPlaceholder={searchPlaceholder}
            emptyText={emptyText}
            customValueLabel={customValueLabel}
            disabled={disabled}
            className={triggerClassName}
          />
        </Field>
      )}
    />
  );
}
