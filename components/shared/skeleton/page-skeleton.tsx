import { cn } from "@/lib/utils";
import { ToolbarSkeleton } from "./toolbar-skeleton";
import { FilterRowSkeleton } from "./filter-row-skeleton";
import { StatCardsSkeleton } from "./stat-cards-skeleton";
import { ChartSkeleton } from "./chart-skeleton";
import { TableSkeleton } from "./table-skeleton";

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
