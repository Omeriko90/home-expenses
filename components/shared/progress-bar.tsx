import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max,
  over = false,
  className,
}: {
  value: number;
  max: number;
  over?: boolean;
  className?: string;
}) {
  const ratio = max > 0 ? Math.min(value / max, 1) : value > 0 ? 1 : 0;
  return (
    <div
      className={cn(
        "flex h-1.5 w-full overflow-hidden rounded-full bg-surface-muted",
        className,
      )}
    >
      {ratio > 0 && (
        <div
          className={cn("h-full rounded-full", over ? "bg-danger" : "bg-success")}
          style={{ width: `${ratio * 100}%` }}
        />
      )}
    </div>
  );
}
