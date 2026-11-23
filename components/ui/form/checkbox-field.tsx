"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function CheckboxField({
  name,
  label,
  required,
  hint,
  disabled,
  className,
}: {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn("flex flex-col gap-1.5", className)}>
          <div className="flex items-center gap-2">
            <Checkbox
              id={name}
              ref={field.ref}
              checked={!!field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              onBlur={field.onBlur}
              disabled={disabled}
              aria-invalid={!!fieldState.error}
            />
            <Label htmlFor={name}>
              {label}
              {required && <span className="text-danger ms-0.5">*</span>}
            </Label>
          </div>
          {hint && !fieldState.error && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
          {fieldState.error && (
            <p className="text-xs text-danger">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
}
