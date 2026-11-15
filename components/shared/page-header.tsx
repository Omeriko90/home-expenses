import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Content toolbar for a page. The page *title* is rendered in the top bar
 * (see components/shell/topbar.tsx), so this only shows an optional
 * description plus the page's action controls, aligned to the end.
 */
export function PageHeader({
  description,
  actions,
  className,
}: {
  /** Kept for API compatibility; the title is shown in the top bar. */
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  if (!description && !actions) return null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Description reads as a subtitle under the page title (in the top bar). */}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {/* Action controls (year selector, buttons…) sit on the start side. */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
