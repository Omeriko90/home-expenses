import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <Skeleton className="h-11 rounded-none bg-surface-muted/70" />
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </div>
    </div>
  );
}
