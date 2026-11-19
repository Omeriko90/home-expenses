"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { createInvitation } from "@/app/actions/settings";
import { useI18n } from "@/lib/i18n/context";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select/Select";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";

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
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"ADMIN" | "MEMBER">("MEMBER");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    startTransition(async () => {
      const res = await createInvitation({ email: email.trim(), role });
      if ("error" in res) {
        if (res.error === "emailExists") toast.error(t.settings.emailExists);
        else if (res.error === "alreadyInvited")
          toast.error(t.settings.alreadyInvited);
        else toast.error(t.common.noData);
        return;
      }
      setEmail("");
      setRole("MEMBER");
      onClose();
      if (res.delivered) {
        toast.success(t.settings.inviteSent);
      } else if (res.inviteUrl) {
        onLinkFallback(res.inviteUrl);
      }
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={t.settings.inviteTitle}
      onSubmit={submit}
      pending={pending}
      submitLabel={pending ? t.common.loading : t.settings.invite}
      contentClassName="max-w-sm"
    >
      <Field label={t.auth.email} htmlFor="invite-email" required>
        <Input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="off"
        />
      </Field>
      <Field label={t.settings.role}>
        <Select
          value={role}
          onValueChange={(v) => setRole(v as "ADMIN" | "MEMBER")}
          options={[
            { value: "MEMBER", label: t.settings.member },
            { value: "ADMIN", label: t.settings.admin },
          ]}
        />
      </Field>
    </FormDialog>
  );
}
