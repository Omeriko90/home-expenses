"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { changePassword } from "@/app/actions/settings";
import { useI18n } from "@/lib/i18n/context";
import type { UseFormReturn } from "react-hook-form";
import {
  createPasswordSchema,
  type PasswordInput,
} from "@/lib/schemas/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form/form";
import { TextField } from "@/components/ui/form/text-field";

export function PasswordForm() {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const schema = useMemo(() => createPasswordSchema(t), [t]);

  function handleSubmit(
    values: PasswordInput,
    form: UseFormReturn<PasswordInput, unknown, PasswordInput>,
  ) {
    startTransition(async () => {
      const res = await changePassword(values);
      if ("error" in res) {
        form.setError("currentPassword", {
          type: "server",
          message: t.settings.wrongPassword,
        });
        return;
      }
      toast.success(t.settings.passwordChanged);
      form.reset();
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form
          schema={schema}
          defaultValues={{ currentPassword: "", newPassword: "" }}
          onSubmit={handleSubmit}
          className="max-w-md"
        >
          <TextField
            name="currentPassword"
            type="password"
            label={t.settings.currentPassword}
            required
            autoComplete="current-password"
          />
          <TextField
            name="newPassword"
            type="password"
            label={t.settings.newPassword}
            required
            autoComplete="new-password"
          />
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? t.common.loading : t.common.save}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
