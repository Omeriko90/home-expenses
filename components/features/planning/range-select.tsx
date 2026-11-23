"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { Select } from "@/components/ui/select/Select";
import type { RangeMonths } from "./types";

const RANGE_OPTIONS: RangeMonths[] = [6, 12, 24];

export function RangeSelect({ range }: { range: RangeMonths }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function handleSelect(value: string) {
    const next = new URLSearchParams(params);
    next.set("range", value);
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <Select
      value={String(range)}
      onValueChange={handleSelect}
      className="w-36"
      options={RANGE_OPTIONS.map((months) => ({
        value: String(months),
        label: t.planning.monthsCount.replace("{n}", String(months)),
      }))}
    />
  );
}
