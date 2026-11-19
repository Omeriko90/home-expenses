import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<"table"> & { containerClassName?: string }) {
  return (
    <div className={cn("relative w-full overflow-x-auto", containerClassName)}>
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn(
        "sticky top-0 z-10 bg-surface [&_tr]:border-b border-border",
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "group/row border-b border-border transition-colors hover:bg-surface-muted/60 data-[state=selected]:bg-surface-muted",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-11 px-3 text-start align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground first:ps-[17px] last:pe-[17px]",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn("px-3 py-2.5 align-middle first:ps-[17px] last:pe-[17px]", className)}
      {...props}
    />
  );
}
