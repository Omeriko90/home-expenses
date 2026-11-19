"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Check, Copy, Pencil, Trash2, UserPlus, X } from "lucide-react";
import {
  removeMember,
  resendInvitation,
  revokeInvitation,
  updateHousehold,
} from "@/app/actions/settings";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { IconButton } from "@/components/shared/icon-button";
import { RowActions } from "@/components/shared/row-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { InviteForm } from "./invite-form";
import type { SettingsUser } from "./settings-view";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
};

export type Invitation = {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  expiresAt: string;
};

export function PeoplePanel({
  currentUser,
  householdName,
  members,
  invitations,
}: {
  currentUser: SettingsUser;
  householdName: string;
  members: Member[];
  invitations: Invitation[];
}) {
  const { t, locale } = useI18n();
  const [pending, startTransition] = useTransition();
  const isAdmin = currentUser.role === "ADMIN";

  const [editingName, setEditingName] = React.useState(false);
  const [hhName, setHhName] = React.useState(householdName);

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [removeTarget, setRemoveTarget] = React.useState<Member | null>(null);
  const [revokeTarget, setRevokeTarget] = React.useState<Invitation | null>(null);

  const [fallbackUrl, setFallbackUrl] = React.useState<string | null>(null);

  function saveHouseholdName() {
    startTransition(async () => {
      const res = await updateHousehold(hhName);
      if ("error" in res) return;
      setEditingName(false);
      toast.success(t.settings.saved);
    });
  }

  function confirmRemove() {
    if (!removeTarget) return;
    startTransition(async () => {
      const res = await removeMember(removeTarget.id);
      setRemoveTarget(null);
      if ("error" in res) {
        if (res.error === "lastAdmin") toast.error(t.settings.lastAdmin);
        else if (res.error === "cannotRemoveSelf")
          toast.error(t.settings.cannotRemoveSelf);
        else toast.error(t.common.noData);
        return;
      }
      toast.success(t.settings.saved);
    });
  }

  function confirmRevoke() {
    if (!revokeTarget) return;
    startTransition(async () => {
      await revokeInvitation(revokeTarget.id);
      setRevokeTarget(null);
      toast.success(t.settings.saved);
    });
  }

  function resend(id: string) {
    startTransition(async () => {
      const res = await resendInvitation(id);
      if ("error" in res) return;
      if (res.delivered) {
        toast.success(t.settings.inviteSent);
      } else if (res.inviteUrl) {
        setFallbackUrl(res.inviteUrl);
      }
    });
  }

  async function copyFallback() {
    if (!fallbackUrl) return;
    await navigator.clipboard.writeText(fallbackUrl);
    toast.success(t.settings.linkCopied);
  }

  const dateFmt = new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", {
    dateStyle: "medium",
  });

  const roleLabel = (role: "ADMIN" | "MEMBER") =>
    role === "ADMIN" ? t.settings.admin : t.settings.member;

  const memberColumns: TableColumn<Member>[] = [
    { header: t.auth.name, cellClassName: "font-medium", cell: (m) => m.name },
    {
      header: t.auth.email,
      cellClassName: "text-muted-foreground",
      cell: (m) => m.email,
    },
    { header: t.settings.role, cell: (m) => <Badge>{roleLabel(m.role)}</Badge> },
    {
      header: t.settings.joined,
      cellClassName: "text-muted-foreground",
      cell: (m) => dateFmt.format(new Date(m.joinedAt)),
    },
    ...(isAdmin
      ? [
          {
            cellClassName: "text-end",
            cell: (m) =>
              m.id !== currentUser.id && (
                <RowActions className="justify-end">
                  <IconButton
                    label={t.settings.remove}
                    onClick={() => setRemoveTarget(m)}
                  >
                    <Trash2 className="text-danger" />
                  </IconButton>
                </RowActions>
              ),
          } satisfies TableColumn<Member>,
        ]
      : []),
  ];

  const invitationColumns: TableColumn<Invitation>[] = [
    {
      header: t.auth.email,
      cellClassName: "font-medium",
      cell: (inv) => inv.email,
    },
    {
      header: t.settings.role,
      cell: (inv) => <Badge>{roleLabel(inv.role)}</Badge>,
    },
    {
      header: t.settings.expires,
      cellClassName: "text-muted-foreground",
      cell: (inv) => dateFmt.format(new Date(inv.expiresAt)),
    },
    ...(isAdmin
      ? [
          {
            cellClassName: "text-end",
            cell: (inv) => (
              <RowActions className="items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => resend(inv.id)}
                >
                  {t.settings.resend}
                </Button>
                <IconButton
                  label={t.settings.revoke}
                  onClick={() => setRevokeTarget(inv)}
                >
                  <Trash2 className="text-danger" />
                </IconButton>
              </RowActions>
            ),
          } satisfies TableColumn<Invitation>,
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t.settings.householdName}</CardTitle>
        </CardHeader>
        <CardContent>
          {editingName ? (
            <div className="flex max-w-md items-center gap-2">
              <Input
                value={hhName}
                onChange={(e) => setHhName(e.target.value)}
                disabled={pending}
              />
              <IconButton label={t.common.save} onClick={saveHouseholdName}>
                <Check />
              </IconButton>
              <IconButton
                label={t.common.cancel}
                onClick={() => {
                  setHhName(householdName);
                  setEditingName(false);
                }}
              >
                <X />
              </IconButton>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{householdName}</span>
              {isAdmin && (
                <IconButton label={t.common.edit} onClick={() => setEditingName(true)}>
                  <Pencil />
                </IconButton>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t.settings.members}</CardTitle>
          {isAdmin && (
            <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-1.5">
              <UserPlus className="size-4" />
              {t.settings.invite}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table
            columns={memberColumns}
            data={members}
            rowKey={(m) => m.id}
            containerClassName="max-h-[min(550px,100dvh)] overflow-y-auto"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.settings.pendingInvites}</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <EmptyState title={t.settings.noPendingInvites} />
          ) : (
            <Table
              columns={invitationColumns}
              data={invitations}
              rowKey={(inv) => inv.id}
              containerClassName="max-h-[min(550px,100dvh)] overflow-y-auto"
            />
          )}

          {fallbackUrl && (
            <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border bg-surface-muted p-3">
              <p className="text-sm text-muted-foreground">
                {t.settings.inviteLinkReady}
              </p>
              <div className="flex items-center gap-2">
                <Input value={fallbackUrl} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={copyFallback} className="gap-1.5 shrink-0">
                  <Copy className="size-4" />
                  {t.settings.copyLink}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && inviteOpen && (
        <InviteForm
          open
          onClose={() => setInviteOpen(false)}
          onLinkFallback={setFallbackUrl}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          open
          onClose={() => setRemoveTarget(null)}
          title={t.settings.removeMemberTitle}
          description={t.settings.removeMemberConfirm}
          confirmLabel={t.settings.remove}
          onConfirm={confirmRemove}
          loading={pending}
        />
      )}
      {revokeTarget && (
        <ConfirmDialog
          open
          onClose={() => setRevokeTarget(null)}
          title={t.settings.revoke}
          description={t.settings.revokeInviteConfirm}
          confirmLabel={t.settings.revoke}
          onConfirm={confirmRevoke}
          loading={pending}
        />
      )}
    </div>
  );
}
