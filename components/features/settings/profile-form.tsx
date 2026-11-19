"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/settings";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/baseSelectComponents";
import { Field } from "@/components/shared/field";
import type { SettingsUser } from "./settings-view";

export function ProfileForm({ user }: { user: SettingsUser }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [name, setName] = React.useState(user.name);
  const [locale, setLocale] = React.useState(user.locale);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      await updateProfile({ name: name.trim(), locale: locale as "he" | "en" });
      // RTL/LTR flip needs the document attributes updated on soft refresh.
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === "he" ? "rtl" : "ltr";
      toast.success(t.settings.saved);
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={submit} className="flex max-w-md flex-col gap-4">
          <Field label={t.auth.email}>
            <Input value={user.email} disabled readOnly />
          </Field>
          <Field label={t.auth.name} htmlFor="profile-name" required>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field label={t.settings.language}>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="he">{t.settings.hebrew}</SelectItem>
                <SelectItem value="en">{t.settings.english}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? t.common.loading : t.common.save}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
