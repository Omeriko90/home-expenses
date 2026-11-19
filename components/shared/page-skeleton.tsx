import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Route-level loading placeholder; variants mirror each page's rough footprint. */
export function PageSkeleton({
  variant,
  className,
}: {
  variant: "dashboard" | "table" | "cards";
  className?: string;
}) {
  return (
    <div aria-busy className={cn("flex flex-col gap-6", className)}>
      <ToolbarSkeleton />
      {variant === "dashboard" && (
        <>
          <StatCardsSkeleton count={3} />
          <div className="grid gap-3 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <TableSkeleton rows={6} />
        </>
      )}
      {variant === "cards" && (
        <>
          <StatCardsSkeleton count={3} />
          <TableSkeleton rows={6} />
        </>
      )}
      {variant === "table" && (
        <>
          <FilterRowSkeleton />
          <TableSkeleton rows={10} />
        </>
      )}
    </div>
  );
}

function ToolbarSkeleton() {
  return (
    <div className="flex items-center justify-between gap-2">
      <Skeleton className="h-9 w-40 rounded-lg" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

function FilterRowSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-9 flex-1 rounded-lg" />
      <Skeleton className="hidden h-9 w-44 rounded-lg sm:block" />
      <Skeleton className="hidden h-9 w-36 rounded-lg sm:block" />
    </div>
  );
}

function StatCardsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-72 rounded-xl" />;
}

function TableSkeleton({ rows }: { rows: number }) {
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
