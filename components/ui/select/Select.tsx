"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./baseSelectComponents";

export type SelectOption = {
  value: string;
  label: React.ReactNode;
  className?: string;
};

export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  itemClassName,
  disabled,
}: {
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  itemClassName?: string;
  disabled?: boolean;
}) {
  return (
    <SelectRoot
      value={value ?? undefined}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem
            key={o.value}
            value={o.value}
            className={cn(itemClassName, o.className)}
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}
