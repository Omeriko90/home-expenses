"use client";

import type { ReactNode } from "react";
import {
  FormProvider,
  type DefaultValues,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import type { z } from "zod";
import { useI18n } from "@/lib/i18n/context";
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/baseDialogComponents";

export function FormDialog<
  TInput extends FieldValues,
  TOutput extends FieldValues,
>({
  open,
  onClose,
  title,
  schema,
  defaultValues,
  onSubmit,
  pending = false,
  submitLabel,
  contentClassName,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  schema: z.ZodType<TOutput, TInput>;
  defaultValues?: DefaultValues<TInput>;
  onSubmit: (
    values: TOutput,
    form: UseFormReturn<TInput, unknown, TOutput>,
  ) => void;
  pending?: boolean;
  submitLabel?: ReactNode;
  contentClassName?: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const methods = useZodForm(schema, { defaultValues });
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit((values) =>
              onSubmit(values, methods),
            )}
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
