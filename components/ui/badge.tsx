import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-surface-muted text-foreground border border-border",
        primary: "bg-primary-tint text-primary border border-border",
        success: "bg-success-subtle text-success border border-success-border",
        danger: "bg-danger-subtle text-danger border border-danger-border",
        warning: "bg-warning-subtle text-warning border border-warning-border",
        info: "bg-info-subtle text-info border border-info-border",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
