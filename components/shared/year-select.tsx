"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select/Select";

export function YearSelect({
  year,
  years,
  className,
}: {
  year: number;
  years: number[];
  className?: string;
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
    <Select
      value={String(year)}
      onValueChange={onChange}
      className={cn("w-28 tnum", className)}
      itemClassName="tnum"
      options={years.map((y) => ({ value: String(y), label: y }))}
    />
  );
}
