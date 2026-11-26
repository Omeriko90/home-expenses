"use client";

import { DayPicker } from "react-day-picker";
import { he } from "react-day-picker/locale";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  localeCode?: "he" | "en";
};

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  localeCode = "he",
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={localeCode === "he" ? he : undefined}
      dir={localeCode === "he" ? "rtl" : "ltr"}
      navLayout="around"
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-3",
        month_caption: "flex items-center justify-between h-9",
        caption_label: "text-sm font-medium",
        button_previous:
          "size-9 inline-flex items-center justify-center rounded-md hover:bg-surface-muted [&_svg]:size-4",
        button_next:
          "size-9 inline-flex items-center justify-center rounded-md hover:bg-surface-muted [&_svg]:size-4",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground w-9 text-xs font-normal",
        week: "flex w-full mt-1",
        day: "size-9 text-center text-sm p-0 relative",
        day_button:
          "size-9 rounded-md font-normal hover:bg-surface-muted aria-selected:opacity-100 inline-flex items-center justify-center",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
        today: "[&>button]:border [&>button]:border-primary",
        outside: "text-muted-foreground opacity-40",
        disabled: "text-muted-foreground opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}
