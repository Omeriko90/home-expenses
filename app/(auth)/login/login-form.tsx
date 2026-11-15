"use client";

import { useActionState } from "react";
import Link from "next/link";
import { authenticate } from "@/app/actions/auth";
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

export function LoginForm() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(authenticate, undefined);

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl">{t.appName}</CardTitle>
        <CardDescription>{t.auth.login}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <Field label={t.auth.email} htmlFor="email">
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label={t.auth.password} htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </Field>
          {state?.error && (
            <p className="text-sm text-danger">{t.auth.invalidCredentials}</p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? t.common.loading : t.auth.signIn}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t.auth.noAccount}{" "}
          <Link href="/register" className="text-primary hover:underline">
            {t.auth.register}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
