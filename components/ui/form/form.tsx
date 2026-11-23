"use client";

import type { ReactNode } from "react";
import {
  FormProvider,
  type DefaultValues,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import type { z } from "zod";
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { cn } from "@/lib/utils";

export function Form<
  TInput extends FieldValues,
  TOutput extends FieldValues,
>({
  schema,
  defaultValues,
  onSubmit,
  className,
  children,
}: {
  schema: z.ZodType<TOutput, TInput>;
  defaultValues?: DefaultValues<TInput>;
  onSubmit: (
    values: TOutput,
    form: UseFormReturn<TInput, unknown, TOutput>,
  ) => void;
  className?: string;
  children: ReactNode;
}) {
  const methods = useZodForm(schema, { defaultValues });
  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit((values) => onSubmit(values, methods))}
        className={cn("flex flex-col gap-4", className)}
        noValidate
      >
        {children}
      </form>
    </FormProvider>
  );
}
