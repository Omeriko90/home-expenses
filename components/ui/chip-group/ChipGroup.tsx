"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { Chip } from "./Chip";

export type ChipGroupItem = {
  value: string;
  label: React.ReactNode;
};

export function ChipGroup({
  items,
  onRemove,
  removeLabel,
  max,
  className,
}: {
  items: ChipGroupItem[];
  onRemove?: (value: string) => void;
  removeLabel?: string;
  max?: number;
  className?: string;
}) {
  const visible = max ? items.slice(0, max) : items;
  const overflow = max ? items.slice(max) : [];

  return (
    <span className={cn("flex min-w-0 items-center gap-1", className)}>
      {visible.map((item) => (
        <Chip
          key={item.value}
          label={item.label}
          removeLabel={removeLabel}
          onRemove={onRemove ? () => onRemove(item.value) : undefined}
        />
      ))}
      {overflow.length > 0 && (
        <Tooltip
          content={
            <span className="flex flex-col gap-0.5 text-start">
              {overflow.map((item) => (
                <span key={item.value}>{item.label}</span>
              ))}
            </span>
          }
        >
          <Chip label={`+${overflow.length}`} className="shrink-0" />
        </Tooltip>
      )}
    </span>
  );
}
