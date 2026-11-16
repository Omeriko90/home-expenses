"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { changePassword } from "@/app/actions/settings";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/shared/field";

export function PasswordForm() {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current || next.length < 6) return;
    startTransition(async () => {
      const res = await changePassword({
        currentPassword: current,
        newPassword: next,
      });
      if ("error" in res) {
        toast.error(t.settings.wrongPassword);
        return;
      }
      toast.success(t.settings.passwordChanged);
      setCurrent("");
      setNext("");
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={submit} className="flex max-w-md flex-col gap-4">
          <Field label={t.settings.currentPassword} htmlFor="current-password" required>
            <Input
              id="current-password"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              autoComplete="current-password"
            />
          </Field>
          <Field label={t.settings.newPassword} htmlFor="new-password" required>
            <Input
              id="new-password"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
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
