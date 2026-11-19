import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function ChartCard({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    // min-w-0 lets the card shrink below the legend strip's intrinsic
    // (nowrap) width when it's a grid item — otherwise it overflows its
    // track on mobile and Recharts locks the chart at the wide measure.
    <Card className={cn("flex min-w-0 flex-col gap-2 p-4", className)}>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground/80">{description}</p>
        )}
      </div>
      {/* recharts lays out LTR only; Hebrew labels render fine inside the SVG. */}
      <div className="h-72 font-sans" dir="ltr">
        {children}
      </div>
    </Card>
  );
}
