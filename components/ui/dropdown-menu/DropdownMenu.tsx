"use client";

import * as React from "react";
import Link from "next/link";
import {
  DropdownMenu as DropdownMenuRoot,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./baseDropdownMenuComponents";

export type DropdownMenuEntry =
  | {
      kind?: "item";
      label: React.ReactNode;
      icon?: React.ReactNode;
      href?: string;
      onSelect?: () => void;
      variant?: "default" | "danger";
    }
  | { kind: "separator" }
  | { kind: "custom"; node: React.ReactNode };

export function DropdownMenu({
  trigger,
  items,
  side,
  align,
  contentClassName,
}: {
  trigger: React.ReactNode;
  items: DropdownMenuEntry[];
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  contentClassName?: string;
}) {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
        className={contentClassName}
      >
        {items.map((item, i) => {
          if (item.kind === "separator") return <DropdownMenuSeparator key={i} />;
          if (item.kind === "custom")
            return <React.Fragment key={i}>{item.node}</React.Fragment>;
          if (item.href) {
            return (
              <DropdownMenuItem key={i} variant={item.variant} asChild>
                <Link href={item.href} className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </Link>
              </DropdownMenuItem>
            );
          }
          return (
            <DropdownMenuItem
              key={i}
              variant={item.variant}
              onSelect={item.onSelect}
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
}
