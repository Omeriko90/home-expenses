"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type AutocompleteOption = {
  value: string;
  label: string;
  hint?: string;
};

export function Autocomplete({
  options,
  value,
  onChange,
  placeholder = "בחר…",
  searchPlaceholder = "חיפוש…",
  emptyText = "לא נמצאו תוצאות",
  /** When set, typing a value not in the options offers it as a new entry,
   * labeled with this template ("{v}" is replaced by the typed text). */
  customValueLabel,
  className,
  disabled,
  id,
}: {
  options: AutocompleteOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  customValueLabel?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const selected = options.find((o) => o.value === value);
  // Collapse inner whitespace and compare case-insensitively so "study Fund"
  // offers the existing "Study fund" instead of a near-duplicate.
  const trimmed = search.trim().replace(/\s+/g, " ");
  const lower = trimmed.toLowerCase();
  const showCustom =
    !!customValueLabel &&
    trimmed !== "" &&
    !options.some(
      (o) =>
        o.value.toLowerCase() === lower || o.label.toLowerCase() === lower,
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-surface px-3 py-2 text-sm shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            !selected && !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="line-clamp-1 text-start">
            {selected ? selected.label : value || placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command
          filter={(value, search, keywords) => {
            const text = `${value} ${(keywords ?? []).join(" ")}`.toLowerCase();
            return text.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {!showCustom && <CommandEmpty>{emptyText}</CommandEmpty>}
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  keywords={[opt.label]}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4 text-primary",
                      value === opt.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex-1">{opt.label}</span>
                  {opt.hint && (
                    <span className="text-xs text-muted-foreground">
                      {opt.hint}
                    </span>
                  )}
                </CommandItem>
              ))}
              {showCustom && (
                <CommandItem
                  value={trimmed}
                  onSelect={() => {
                    onChange(trimmed);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <Plus className="size-4 text-primary" />
                  <span className="flex-1">
                    {customValueLabel!.replace("{v}", trimmed)}
                  </span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
