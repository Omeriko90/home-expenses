import { cn } from "@/lib/utils";

export function RowActions({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-0.5 transition-opacity",
        "pointer-fine:pointer-events-none pointer-fine:opacity-0",
        "pointer-fine:focus-within:pointer-events-auto pointer-fine:focus-within:opacity-100",
        "pointer-fine:group-hover/row:pointer-events-auto pointer-fine:group-hover/row:opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}
