"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/baseDialogComponents";

export function FormDialog({
  open,
  onClose,
  title,
  onSubmit,
  pending = false,
  submitLabel,
  contentClassName,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  pending?: boolean;
  submitLabel?: React.ReactNode;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {children}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {submitLabel ?? t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
