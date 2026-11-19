import { Skeleton } from "@/components/ui/skeleton";

export function ToolbarSkeleton() {
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
