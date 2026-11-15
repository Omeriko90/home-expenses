"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { setLocale } from "@/app/actions/locale";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";

export function LocaleToggle() {
  const { locale } = useI18n();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = locale === "he" ? "en" : "he";
    // Next.js does NOT re-apply the root <html lang/dir> on a soft refresh, so
    // flip it on the document directly — this is what makes every page and
    // component (flex direction, logical paddings, tabs, etc.) react to RTL.
    document.documentElement.lang = next;
    document.documentElement.dir = next === "he" ? "rtl" : "ltr";
    startTransition(() => {
      setLocale(next);
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={pending}
      className="gap-1.5"
    >
      <Languages className="size-4" />
      {locale === "he" ? "EN" : "עב"}
    </Button>
  );
}
