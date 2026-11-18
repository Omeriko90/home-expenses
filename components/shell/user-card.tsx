"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { LogoutButton } from "./logout-button";
import { useI18n } from "@/lib/i18n/context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// userName falls back to the email upstream, so an "@" means there is no
// real name to take initials from.
function initials(name: string, email: string): string {
  if (!name || name.includes("@")) return (email[0] ?? "?").toUpperCase();
  const words = name.trim().split(/\s+/);
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function UserCard({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const { t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-surface-muted p-3 text-start transition-colors hover:bg-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-semibold text-white">
            {initials(userName, userEmail)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">
              {userName}
            </span>
            <span
              dir="ltr"
              className="block truncate text-xs text-muted-foreground"
            >
              {userEmail}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="size-4" />
            {t.nav.settings}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <LogoutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
