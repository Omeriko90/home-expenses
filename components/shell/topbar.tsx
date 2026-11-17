"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Settings, User } from "lucide-react";
import { Nav } from "./nav";
import { LogoutButton } from "./logout-button";
import { useI18n } from "@/lib/i18n/context";
import { IconButton } from "@/components/shared/icon-button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_KEYS = [
  "dashboard",
  "transactions",
  "categories",
  "budgets",
  "goals",
  "investments",
  "settings",
] as const;

export function Topbar({ userName }: { userName: string }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const side = locale === "he" ? "right" : "left";

  const pageKey =
    PAGE_KEYS.find((k) => pathname === `/${k}` || pathname.startsWith(`/${k}/`)) ??
    "dashboard";
  const pageTitle = t.nav[pageKey];

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
              <div className="px-3 pb-6">
                <Nav onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <h1 className="text-lg font-semibold tracking-tight">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton label={userName}>
              <User />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{userName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="size-4" />
                {t.nav.settings}
              </Link>
            </DropdownMenuItem>
            <LogoutButton />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
