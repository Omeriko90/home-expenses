"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function YearSelect({
  year,
  years,
}: {
  year: number;
  years: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function onChange(value: string) {
    const next = new URLSearchParams(params);
    next.set("year", value);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <Select value={String(year)} onValueChange={onChange}>
      <SelectTrigger className="w-28 tnum">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)} className="tnum">
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
