"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { Select } from "@/components/ui/select/Select";
import type { HorizonMonths } from "./types";

const OPTIONS: HorizonMonths[] = [6, 12, 24];

export function HorizonSelect({ horizon }: { horizon: HorizonMonths }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function pick(value: string) {
    const next = new URLSearchParams(params);
    next.set("horizon", value);
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <Select
      value={String(horizon)}
      onValueChange={pick}
      className="w-36"
      options={OPTIONS.map((h) => ({
        value: String(h),
        label: t.planning.horizonMonths.replace("{n}", String(h)),
      }))}
    />
  );
}
