"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerUser } from "@/app/actions/auth";
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

export function RegisterForm() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(registerUser, undefined);

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl">{t.appName}</CardTitle>
        <CardDescription>{t.auth.register}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <Field label={t.auth.name} htmlFor="name">
            <Input id="name" name="name" required autoComplete="name" />
          </Field>
          <Field label={t.auth.email} htmlFor="email">
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label={t.auth.password} htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </Field>
          {state?.error && (
            <p className="text-sm text-danger">
              {state.error === "exists"
                ? t.auth.haveAccount
                : t.auth.invalidCredentials}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? t.common.loading : t.auth.signUp}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t.auth.haveAccount}{" "}
          <Link href="/login" className="text-primary hover:underline">
            {t.auth.login}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
