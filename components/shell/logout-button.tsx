"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { useI18n } from "@/lib/i18n/context";

export function LogoutButton() {
  const { t } = useI18n();
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-danger outline-none transition-colors hover:bg-danger/10"
      >
        <LogOut className="size-4" />
        {t.nav.logout}
      </button>
    </form>
  );
}
