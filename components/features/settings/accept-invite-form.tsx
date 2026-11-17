"use client";

import { useActionState } from "react";
import { acceptInvitation } from "@/app/actions/invite";
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

export function AcceptInviteForm({
  token,
  email,
  householdName,
}: {
  token: string;
  email: string;
  householdName: string;
}) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(acceptInvitation, undefined);

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl">{t.invite.title}</CardTitle>
        <CardDescription>
          {t.invite.invitedTo}{" "}
          <span className="font-semibold text-foreground">{householdName}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <Field label={t.auth.email} htmlFor="email">
            <Input id="email" value={email} disabled readOnly />
          </Field>
          <Field label={t.auth.name} htmlFor="name">
            <Input id="name" name="name" required autoComplete="name" />
          </Field>
          <Field label={t.auth.password} htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>
          {state?.error && (
            <p className="text-sm text-danger">{t.invite.invalidInvite}</p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? t.common.loading : t.invite.accept}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
