import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export const categorySchema = z.object({
  name: z.string().min(1).max(80),
  nameEn: z.string().max(80).optional().nullable(),
  description: z.string().max(200).optional().nullable(),
  type: z.enum(["EXPENSE", "INVESTMENT"]),
  color: z.string().max(20).optional().nullable(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export function createCategoryFormSchema(t?: Dictionary) {
  return z.object({
    name: z.string().trim().min(1, t?.errors.required).max(80),
    description: z.string().max(200),
    color: z.string().max(20).nullable(),
  });
}

export type CategoryFormValues = z.infer<
  ReturnType<typeof createCategoryFormSchema>
>;
