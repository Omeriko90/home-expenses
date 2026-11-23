"use client";

import { get, useFormContext, type FieldError } from "react-hook-form";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";

export function TextField({
  name,
  label,
  type = "text",
  required,
  hint,
  placeholder,
  disabled,
  readOnly,
  autoComplete,
  autoFocus,
  className,
  inputClassName,
}: {
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
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
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        aria-invalid={!!error}
        className={inputClassName}
        {...register(name)}
      />
    </Field>
  );
}
