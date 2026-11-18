import { cn } from "@/lib/utils";

/**
 * Container for per-row action buttons. On hover-capable (pointer-fine)
 * devices the actions are hidden until the surrounding `group/row` element
 * is hovered or a button inside receives focus; touch devices always show
 * them since they have no hover. While hidden they also drop pointer
 * events, so a stray tap (e.g. touchscreen laptops report pointer-fine)
 * can't hit an invisible button; keyboard focus is unaffected.
 */
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
