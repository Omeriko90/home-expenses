"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/shared/icon-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function MonthYearPicker({
  year,
  month,
}: {
  year: number;
  month: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(year);

  React.useEffect(() => {
    if (open) setViewYear(year);
  }, [open, year]);

  function pick(m: number) {
    const next = new URLSearchParams(params);
    next.set("year", String(viewYear));
    next.set("month", String(m));
    router.push(`${pathname}?${next.toString()}`);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-surface px-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <CalendarDays className="size-4 opacity-60" />
          <span className="tnum">
            {t.months[month - 1]} {year}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
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
                onClick={() => pick(i + 1)}
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
