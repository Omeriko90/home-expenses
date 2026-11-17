"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";
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

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    undefined,
  );

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl">{t.appName}</CardTitle>
        <CardDescription>{t.auth.resetPassword}</CardDescription>
      </CardHeader>
      <CardContent>
        {state?.success ? (
          <p className="text-center text-sm">{t.auth.resetEmailSent}</p>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <Field label={t.auth.email} htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </Field>
            {state?.error && (
              <p className="text-sm text-danger">
                {state.error === "rateLimited"
                  ? t.auth.tooManyAttempts
                  : t.auth.invalidCredentials}
              </p>
            )}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? t.common.loading : t.auth.sendResetLink}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            {t.auth.backToLogin}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
