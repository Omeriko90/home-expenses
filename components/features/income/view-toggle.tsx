"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { View, type ViewMode } from "./types";

export function ViewToggle({ view }: { view: ViewMode }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function handleViewChange(next: string) {
    const searchParams = new URLSearchParams(params);
    if (next === View.Year) searchParams.set("view", View.Year);
    else searchParams.delete("view");
    router.push(`${pathname}?${searchParams.toString()}`);
  }

  return (
    <Tabs value={view} onValueChange={handleViewChange}>
      <TabsList>
        <TabsTrigger value={View.Month}>{t.income.monthView}</TabsTrigger>
        <TabsTrigger value={View.Year}>{t.income.yearView}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
