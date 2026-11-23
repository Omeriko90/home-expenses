"use client";

import { get, useFormContext, type FieldError } from "react-hook-form";
import { Field } from "@/components/shared/field";
import { cn } from "@/lib/utils";

export function TextareaField({
  name,
  label,
  required,
  hint,
  placeholder,
  disabled,
  rows = 3,
  className,
  inputClassName,
}: {
  name: string;
  label?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
  inputClassName?: string;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = get(errors, name) as FieldError | undefined;

  return (
    <Field
      label={label}
      htmlFor={name}
      required={required}
      hint={hint}
      error={error?.message}
      className={className}
    >
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        className={cn(
          "flex w-full rounded-md border border-input bg-surface px-3 py-2 text-sm shadow-sm transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          inputClassName,
        )}
        {...register(name)}
      />
    </Field>
  );
}
