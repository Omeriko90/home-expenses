"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface MoneyInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: number | "";
  onValueChange: (value: number | "") => void;
}

/** Numeric money input with a ₪ affix. Emits a number (or "" when empty). */
export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, className, ...props }, ref) => {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-sm text-muted-foreground">
          ₪
        </span>
        <Input
          ref={ref}
          inputMode="decimal"
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            onValueChange(v === "" ? "" : Number(v));
          }}
          className={cn("ps-7 tnum", className)}
          {...props}
        />
      </div>
    );
  },
);
MoneyInput.displayName = "MoneyInput";
