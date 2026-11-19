"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "./logout-button";
import { useI18n } from "@/lib/i18n/context";
import { DropdownMenu } from "@/components/ui/dropdown-menu/DropdownMenu";

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
    <DropdownMenu
      side="top"
      align="start"
      contentClassName="w-[var(--radix-dropdown-menu-trigger-width)]"
      trigger={
        <Button
          variant="ghost"
          className="h-auto w-full justify-start gap-3 rounded-xl bg-surface-muted p-3 text-start enabled:hover:bg-border/60"
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
        </Button>
      }
      items={[
        {
          label: t.nav.settings,
          icon: <Settings className="size-4" />,
          href: "/settings",
        },
        { kind: "separator" },
        { kind: "custom", node: <LogoutButton /> },
      ]}
    />
  );
}
