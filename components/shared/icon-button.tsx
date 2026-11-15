import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  label: string; // accessible label (required)
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, className, variant = "ghost", children, ...props }, ref) => (
    <Button
      ref={ref}
      size="icon"
      variant={variant}
      aria-label={label}
      title={label}
      className={cn("rounded-md", className)}
      {...props}
    >
      {children}
    </Button>
  ),
);
IconButton.displayName = "IconButton";
