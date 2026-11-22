"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/shared/icon-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function MonthYearField({
  year,
  month,
  onChange,
  id,
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  id?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(year);

  React.useEffect(() => {
    if (open) setViewYear(year);
  }, [open, year]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-surface px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <CalendarDays className="size-4 opacity-60" />
          <span className="tnum">
            {t.months[month - 1]} {year}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <div className="mb-2 flex items-center justify-between">
          <IconButton
            label="−"
            variant="ghost"
            onClick={() => setViewYear((y) => y - 1)}
          >
            <ChevronLeft className="rtl:hidden" />
            <ChevronRight className="hidden rtl:block" />
          </IconButton>
          <span className="font-semibold tnum">{viewYear}</span>
          <IconButton
            label="+"
            variant="ghost"
            onClick={() => setViewYear((y) => y + 1)}
          >
            <ChevronRight className="rtl:hidden" />
            <ChevronLeft className="hidden rtl:block" />
          </IconButton>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {t.months.map((m, i) => {
            const active = viewYear === year && i + 1 === month;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onChange(viewYear, i + 1);
                  setOpen(false);
                }}
                className={cn(
                  "rounded-md py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-surface-muted",
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
