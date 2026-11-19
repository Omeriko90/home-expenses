import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      variant="table"
      className="h-[calc(100dvh-7rem-1px)] min-h-0 overflow-hidden"
    />
  );
}
