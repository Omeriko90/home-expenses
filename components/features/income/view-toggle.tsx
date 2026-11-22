"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function ViewToggle({ view }: { view: "month" | "year" }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setView(next: "month" | "year") {
    const sp = new URLSearchParams(params);
    if (next === "year") sp.set("view", "year");
    else sp.delete("view");
    router.push(`${pathname}?${sp.toString()}`);
  }

  const options = [
    { value: "month" as const, label: t.income.monthView },
    { value: "year" as const, label: t.income.yearView },
  ];

  return (
    <div className="flex rounded-lg border border-border bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setView(o.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            view === o.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
