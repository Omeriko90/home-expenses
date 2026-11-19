import { Skeleton } from "@/components/ui/skeleton";

export function FilterRowSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-9 flex-1 rounded-lg" />
      <Skeleton className="hidden h-9 w-44 rounded-lg sm:block" />
      <Skeleton className="hidden h-9 w-36 rounded-lg sm:block" />
    </div>
  );
}
