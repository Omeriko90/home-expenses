import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  description,
  actions,
  className,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  if (!description && !actions) return null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
