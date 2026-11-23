"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(year);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setViewYear(year);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className="w-full justify-start gap-2 bg-surface font-normal shadow-sm"
        >
          <CalendarDays className="size-4 opacity-60" />
          <span className="tnum">
            {t.months[month - 1]} {year}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <div className="mb-2 flex items-center justify-between">
          <IconButton
            label="−"
            variant="ghost"
            onClick={() => setViewYear((currentYear) => currentYear - 1)}
          >
            <ChevronLeft className="rtl:hidden" />
            <ChevronRight className="hidden rtl:block" />
          </IconButton>
          <span className="font-semibold tnum">{viewYear}</span>
          <IconButton
            label="+"
            variant="ghost"
            onClick={() => setViewYear((currentYear) => currentYear + 1)}
          >
            <ChevronRight className="rtl:hidden" />
            <ChevronLeft className="hidden rtl:block" />
          </IconButton>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {t.months.map((monthName, monthIndex) => {
            const active = viewYear === year && monthIndex + 1 === month;
            return (
              <Button
                key={monthIndex}
                variant={active ? "primary" : "ghost"}
                size="sm"
                className={cn("font-normal", active && "font-medium")}
                onClick={() => {
                  onChange(viewYear, monthIndex + 1);
                  setOpen(false);
                }}
              >
                {monthName}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
