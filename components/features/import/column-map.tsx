"use client";

import { Field } from "@/components/shared/field";
import { Select, type SelectOption } from "@/components/ui/select/Select";

export function ColumnMap({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange} options={options} />
    </Field>
  );
}
