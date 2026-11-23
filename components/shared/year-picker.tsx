"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/icon-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const RANGE = 12;

export function YearPicker({ year }: { year: number }) {
  const [open, setOpen] = useState(false);
  const [viewStart, setViewStart] = useState(year - 6);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const years = Array.from({ length: RANGE }, (_, i) => viewStart + i);

  useEffect(() => {
    if (open) setViewStart(year - 6);
  }, [open, year]);

  function handleSelection(selectedYear: number) {
    const searchParams = new URLSearchParams(params);
    searchParams.set("year", String(selectedYear));
    router.push(`${pathname}?${searchParams.toString()}`);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 font-medium">
          <CalendarDays className="size-4 opacity-60" />
          <span className="tnum">{year}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="mb-2 flex items-center justify-between">
          <IconButton
            label="−"
            variant="ghost"
            onClick={() => setViewStart((y) => y - RANGE)}
          >
            <ChevronLeft className="rtl:hidden" />
            <ChevronRight className="hidden rtl:block" />
          </IconButton>
          <span className="font-semibold tnum">
            {years[0]}–{years[years.length - 1]}
          </span>
          <IconButton
            label="+"
            variant="ghost"
            onClick={() => setViewStart((y) => y + RANGE)}
          >
            <ChevronRight className="rtl:hidden" />
            <ChevronLeft className="hidden rtl:block" />
          </IconButton>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {years.map((y) => (
            <Button
              key={y}
              variant={y === year ? "primary" : "ghost"}
              onClick={() => handleSelection(y)}
              className={cn("tnum", y !== year && "font-normal")}
            >
              {y}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
