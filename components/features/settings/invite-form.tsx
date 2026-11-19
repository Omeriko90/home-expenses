"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { createInvitation } from "@/app/actions/settings";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/baseDialogComponents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/baseSelectComponents";
import { Field } from "@/components/shared/field";

export function InviteForm({
  open,
  onOpenChange,
  onLinkFallback,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
      onOpenChange(false);
      if (res.delivered) {
        toast.success(t.settings.inviteSent);
      } else if (res.inviteUrl) {
        onLinkFallback(res.inviteUrl);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.settings.inviteTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
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
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">{t.settings.member}</SelectItem>
                <SelectItem value="ADMIN">{t.settings.admin}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t.common.loading : t.settings.invite}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
