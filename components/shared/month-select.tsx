"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/baseSelectComponents";

/** Month picker that drives the `?month=` URL param (preserves other params). */
export function MonthSelect({ month }: { month: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function onChange(value: string) {
    const next = new URLSearchParams(params);
    next.set("month", value);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <Select value={String(month)} onValueChange={onChange}>
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {t.months.map((m, i) => (
          <SelectItem key={i} value={String(i + 1)}>
            {m}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
