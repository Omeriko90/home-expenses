import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export const TransactionKinds = {
  Fixed: "FIXED",
  Variable: "VARIABLE",
} as const;

export type TransactionKind =
  (typeof TransactionKinds)[keyof typeof TransactionKinds];

export const transactionSchema = z.object({
  date: z.string().min(1),
  businessName: z.string().min(1).max(200),
  amount: z.number(),
  categoryId: z.string().min(1),
  kind: z.enum([TransactionKinds.Fixed, TransactionKinds.Variable]),
  note: z.string().max(500).optional().nullable(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export function createTransactionFormSchema(t?: Dictionary) {
  return transactionSchema.omit({ date: true, amount: true, note: true }).extend({
    date: z.date(t?.errors.required),
    amount: z.number(t?.errors.amountRequired),
    businessName: z.string().trim().min(1, t?.errors.required).max(200),
    categoryId: z.string().min(1, t?.errors.required),
    note: z.string().max(500),
  });
}

export type TransactionFormValues = z.infer<
  ReturnType<typeof createTransactionFormSchema>
>;
