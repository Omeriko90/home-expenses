"use client";

import * as React from "react";
import {
  Accordion as AccordionRoot,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./baseAccordionComponents";

export type AccordionItemDef = {
  value: string;
  trigger: React.ReactNode;
  content: React.ReactNode;
  itemClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
};

type AccordionProps = {
  items: AccordionItemDef[];
  className?: string;
} & (
  | {
      type?: "single";
      collapsible?: boolean;
      onValueChange?: (value: string) => void;
    }
  | { type: "multiple"; onValueChange?: (value: string[]) => void }
);

export function Accordion({ items, className, ...rest }: AccordionProps) {
  const rootProps = (
    rest.type === "multiple"
      ? { type: "multiple", onValueChange: rest.onValueChange }
      : {
          type: "single",
          collapsible: rest.collapsible ?? true,
          onValueChange: rest.onValueChange,
        }
  ) as React.ComponentProps<typeof AccordionRoot>;

  return (
    <AccordionRoot {...rootProps} className={className}>
      {items.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          className={item.itemClassName}
        >
          <AccordionTrigger className={item.triggerClassName}>
            {item.trigger}
          </AccordionTrigger>
          <AccordionContent className={item.contentClassName}>
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </AccordionRoot>
  );
}
