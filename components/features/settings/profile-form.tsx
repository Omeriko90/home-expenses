"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/settings";
import { useI18n } from "@/lib/i18n/context";
import { dir, type Locale } from "@/lib/i18n/dictionaries";
import {
  createProfileSchema,
  type ProfileInput,
} from "@/lib/schemas/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/shared/field";
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { Form } from "@/components/ui/form/form";
import { TextField } from "@/components/ui/form/text-field";
import { SelectField } from "@/components/ui/form/select-field";
import type { SettingsUser } from "./settings-view";

export function ProfileForm({ user }: { user: SettingsUser }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const schema = useMemo(() => createProfileSchema(t), [t]);
  const methods = useZodForm(schema, {
    defaultValues: { name: user.name, locale: user.locale as Locale },
  });

  function handleSubmit(values: ProfileInput) {
    startTransition(async () => {
      await updateProfile(values);
      document.documentElement.lang = values.locale;
      document.documentElement.dir = dir(values.locale);
      toast.success(t.settings.saved);
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form
          methods={methods}
          onSubmit={handleSubmit}
          className="max-w-md"
        >
          <Field label={t.auth.email}>
            <Input value={user.email} disabled readOnly />
          </Field>
          <TextField name="name" label={t.auth.name} required />
          <SelectField
            name="locale"
            label={t.settings.language}
            options={[
              { value: "he", label: t.settings.hebrew },
              { value: "en", label: t.settings.english },
            ]}
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
