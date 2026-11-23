"use client";

import {
  useForm,
  type FieldValues,
  type UseFormProps,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

export function useZodForm<
  TInput extends FieldValues,
  TOutput extends FieldValues,
>(
  schema: z.ZodType<TOutput, TInput>,
  options?: Omit<UseFormProps<TInput, unknown, TOutput>, "resolver">,
) {
  return useForm<TInput, unknown, TOutput>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    ...options,
  });
}
