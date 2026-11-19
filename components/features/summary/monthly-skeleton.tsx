import { Skeleton } from "@/components/ui/skeleton";

export function MonthlySkeleton() {
  return (
    <div className="flex flex-col gap-2 px-3 py-4" aria-busy>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
