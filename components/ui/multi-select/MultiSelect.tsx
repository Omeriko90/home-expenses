"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChipGroup } from "@/components/ui/chip-group/ChipGroup";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MAX_VISIBLE_CHIPS = 2;

export type MultiSelectOption = {
  value: string;
  label: React.ReactNode;
};

export function MultiSelect({
  values,
  onValuesChange,
  options,
  placeholder,
  removeLabel,
  className,
}: {
  values: string[];
  onValuesChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder: string;
  removeLabel?: string;
  className?: string;
}) {
  const selected = options.filter((option) => values.includes(option.value));

  function toggleValue(value: string) {
    onValuesChange(
      values.includes(value)
        ? values.filter((existing) => existing !== value)
        : [...values, value],
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-surface px-3 py-2 text-sm shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            className,
          )}
        >
          {selected.length === 0 ? (
            <span className="truncate">{placeholder}</span>
          ) : (
            <ChipGroup
              items={selected}
              onRemove={toggleValue}
              removeLabel={removeLabel}
              max={MAX_VISIBLE_CHIPS}
            />
          )}
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-80 w-[var(--radix-popover-trigger-width)] min-w-40 overflow-y-auto p-1"
      >
        {options.map((option) => {
          const checked = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleValue(option.value)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm hover:bg-surface-muted"
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center",
                  !checked && "opacity-0",
                )}
              >
                <Check className="size-4 text-primary" strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
