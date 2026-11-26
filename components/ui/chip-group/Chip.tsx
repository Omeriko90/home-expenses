"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex min-w-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs",
  {
    variants: {
      variant: {
        default: "bg-surface-subtle text-foreground",
        success: "bg-success-subtle text-success",
        danger: "bg-danger-subtle text-danger",
        warning: "bg-warning-subtle text-warning",
        info: "bg-info-subtle text-info",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export const Chip = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> &
    VariantProps<typeof chipVariants> & {
      label: React.ReactNode;
      onRemove?: () => void;
      removeLabel?: string;
    }
>(({ label, onRemove, removeLabel, variant, className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(chipVariants({ variant }), className)}
      {...props}
    >
      <span className="truncate">{label}</span>
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label={removeLabel}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.stopPropagation();
              event.preventDefault();
              onRemove();
            }
          }}
          className="rounded-full opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3" />
        </span>
      )}
    </span>
  );
});
Chip.displayName = "Chip";
