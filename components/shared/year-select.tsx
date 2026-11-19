"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select/Select";

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
    <Select
      value={String(year)}
      onValueChange={onChange}
      className="w-28 tnum"
      itemClassName="tnum"
      options={years.map((y) => ({ value: String(y), label: y }))}
    />
  );
}
