"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { createInvitation } from "@/app/actions/settings";
import { useI18n } from "@/lib/i18n/context";
import {
  createInviteSchema,
  InviteErrors,
  UserRoles,
  type InviteInput,
} from "@/lib/schemas/settings";
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { RhfFormDialog } from "@/components/ui/form/form-dialog";
import { TextField } from "@/components/ui/form/text-field";
import { SelectField } from "@/components/ui/form/select-field";

export function InviteForm({
  open,
  onClose,
  onLinkFallback,
}: {
  open: boolean;
  onClose: () => void;
  onLinkFallback: (url: string) => void;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const schema = useMemo(() => createInviteSchema(t), [t]);
  const methods = useZodForm(schema, {
    defaultValues: { email: "", role: UserRoles.Member },
  });

  function handleSubmit(values: InviteInput) {
    startTransition(async () => {
      const res = await createInvitation(values);
      if ("error" in res) {
        switch (res.error) {
          case InviteErrors.EmailExists:
            methods.setError("email", {
              type: "server",
              message: t.settings.emailExists,
            });
            break;
          case InviteErrors.AlreadyInvited:
            methods.setError("email", {
              type: "server",
              message: t.settings.alreadyInvited,
            });
            break;
          default:
            toast.error(t.common.noData);
        }
        return;
      }
      methods.reset();
      onClose();
      if (res.delivered) {
        toast.success(t.settings.inviteSent);
      } else if (res.inviteUrl) {
        onLinkFallback(res.inviteUrl);
      }
    });
  }

  return (
    <RhfFormDialog
      open={open}
      onClose={onClose}
      title={t.settings.inviteTitle}
      methods={methods}
      onSubmit={handleSubmit}
      pending={pending}
      submitLabel={pending ? t.common.loading : t.settings.invite}
      contentClassName="max-w-sm"
    >
      <TextField
        name="email"
        type="email"
        label={t.auth.email}
        required
        autoComplete="off"
      />
      <SelectField
        name="role"
        label={t.settings.role}
        options={[
          { value: UserRoles.Member, label: t.settings.member },
          { value: UserRoles.Admin, label: t.settings.admin },
        ]}
      />
    </RhfFormDialog>
  );
}
