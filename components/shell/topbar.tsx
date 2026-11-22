"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Nav } from "./nav";
import { UserCard } from "./user-card";
import { useI18n } from "@/lib/i18n/context";
import { IconButton } from "@/components/shared/icon-button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const PAGE_KEYS = [
  "dashboard",
  "transactions",
  "income",
  "categories",
  "budgets",
  "goals",
  "planning",
  "investments",
  "settings",
] as const;

export function Topbar({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const side = locale === "he" ? "right" : "left";

  const pageKey =
    PAGE_KEYS.find((k) => pathname === `/${k}` || pathname.startsWith(`/${k}/`)) ??
    "dashboard";
  const pageTitle = t.nav[pageKey];
  const pageSubtitle =
    pageKey === "planning"
      ? t.planning.subtitle
      : pageKey === "income"
        ? t.income.subtitle
        : undefined;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border bg-surface/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <IconButton label="Menu">
                <Menu />
              </IconButton>
            </SheetTrigger>
            <SheetContent side={side} className="p-0">
              <SheetHeader>
                <SheetTitle className="text-primary">{t.appName}</SheetTitle>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-3">
                <Nav onNavigate={() => setOpen(false)} />
              </div>
              <SheetFooter className="border-t border-border p-3">
                <UserCard userName={userName} userEmail={userEmail} />
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex min-w-0 flex-col">
          <h1 className="text-lg font-semibold tracking-tight">{pageTitle}</h1>
          {pageSubtitle && (
            <p className="truncate text-xs text-muted-foreground">
              {pageSubtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
