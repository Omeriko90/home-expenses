import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function ChartCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("flex flex-col gap-2 p-4", className)}>
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {/* recharts lays out LTR only; Hebrew labels render fine inside the SVG. */}
      <div className="h-72 font-sans" dir="ltr">
        {children}
      </div>
    </Card>
  );
}
