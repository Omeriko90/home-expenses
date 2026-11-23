"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { changePassword } from "@/app/actions/settings";
import { useI18n } from "@/lib/i18n/context";
import {
  createPasswordSchema,
  type PasswordInput,
} from "@/lib/schemas/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { Form } from "@/components/ui/form/form";
import { TextField } from "@/components/ui/form/text-field";

export function PasswordForm() {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const schema = useMemo(() => createPasswordSchema(t), [t]);
  const methods = useZodForm(schema, {
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  function handleSubmit(values: PasswordInput) {
    startTransition(async () => {
      const res = await changePassword(values);
      if ("error" in res) {
        methods.setError("currentPassword", {
          type: "server",
          message: t.settings.wrongPassword,
        });
        return;
      }
      toast.success(t.settings.passwordChanged);
      methods.reset();
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form methods={methods} onSubmit={handleSubmit} className="max-w-md">
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
