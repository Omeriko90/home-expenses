"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { Select } from "@/components/ui/select/Select";

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
    <Select
      value={String(month)}
      onValueChange={onChange}
      className="w-36"
      options={t.months.map((m, i) => ({ value: String(i + 1), label: m }))}
    />
  );
}
