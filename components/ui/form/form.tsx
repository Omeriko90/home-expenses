"use client";

import * as React from "react";
import {
  FormProvider,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import { cn } from "@/lib/utils";

export function Form<
  TInput extends FieldValues,
  TOutput extends FieldValues,
>({
  methods,
  onSubmit,
  className,
  children,
}: {
  methods: UseFormReturn<TInput, unknown, TOutput>;
  onSubmit: SubmitHandler<TOutput>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-4", className)}
        noValidate
      >
        {children}
      </form>
    </FormProvider>
  );
}
