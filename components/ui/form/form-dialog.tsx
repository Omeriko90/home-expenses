"use client";

import * as React from "react";
import {
  FormProvider,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/baseDialogComponents";

export function RhfFormDialog<
  TInput extends FieldValues,
  TOutput extends FieldValues,
>({
  open,
  onClose,
  title,
  methods,
  onSubmit,
  pending = false,
  submitLabel,
  contentClassName,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  methods: UseFormReturn<TInput, unknown, TOutput>;
  onSubmit: SubmitHandler<TOutput>;
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
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
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
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
