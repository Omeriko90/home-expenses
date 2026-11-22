"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Banknote,
  Tags,
  Wallet,
  Target,
  CalendarClock,
  TrendingUp,
  Settings,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/transactions", key: "transactions", icon: Receipt },
  { href: "/income", key: "income", icon: Banknote },
  { href: "/categories", key: "categories", icon: Tags },
  { href: "/budgets", key: "budgets", icon: Wallet },
  { href: "/goals", key: "goals", icon: Target },
  { href: "/planning", key: "planning", icon: CalendarClock },
  { href: "/investments", key: "investments", icon: TrendingUp },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

export function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ href, key, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
            )}
          >
            <Icon className="size-5" />
            {t.nav[key]}
          </Link>
        );
      })}
    </nav>
  );
}
