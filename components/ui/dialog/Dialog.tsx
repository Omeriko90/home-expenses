"use client";

import * as React from "react";
import {
  Dialog as DialogRoot,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./baseDialogComponents";

export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  footerClassName,
  contentClassName,
  fullScreen = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  footerClassName?: string;
  contentClassName?: string;
  fullScreen?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <DialogRoot open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent fullScreen={fullScreen} className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {footer && <DialogFooter className={footerClassName}>{footer}</DialogFooter>}
      </DialogContent>
    </DialogRoot>
  );
}
