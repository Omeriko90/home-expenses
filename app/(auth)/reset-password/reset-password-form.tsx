"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "@/app/actions/auth";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/shared/field";

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(resetPassword, undefined);

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl">{t.appName}</CardTitle>
        <CardDescription>{t.auth.resetPassword}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <Field label={t.auth.newPassword} htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              {t.auth.passwordHint}
            </p>
          </Field>
          {state?.error && (
            <p className="text-sm text-danger">
              {state.error === "invalidToken"
                ? t.auth.invalidResetLink
                : t.auth.registrationFailed}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? t.common.loading : t.auth.resetPassword}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            {t.auth.backToLogin}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
