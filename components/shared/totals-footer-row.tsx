import { cn } from "@/lib/utils";

export function TotalsFooterRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between border-t border-border bg-surface-muted/50 px-4 py-3 text-sm font-semibold",
        className,
      )}
    >
      {children}
    </div>
  );
}
