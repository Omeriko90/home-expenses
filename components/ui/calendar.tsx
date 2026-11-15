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
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-3",
        month_caption: "flex justify-center items-center h-9 relative",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1 absolute inset-x-0 justify-between px-1",
        button_previous:
          "size-7 inline-flex items-center justify-center rounded-md hover:bg-surface-muted",
        button_next:
          "size-7 inline-flex items-center justify-center rounded-md hover:bg-surface-muted",
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
