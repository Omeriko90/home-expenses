import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export const holdingSchema = z.object({
  portfolioId: z.string().min(1),
  holdingId: z.string().optional().nullable(),
  channel: z.string().max(80),
  instrument: z.string().min(1).max(120),
  house: z.string().max(120),
  type: z.string().max(120),
  year: z.number().int(),
  value: z.number().min(0),
});

export type HoldingInput = z.infer<typeof holdingSchema>;

export function createHoldingFormSchema(t?: Dictionary) {
  return z.object({
    instrument: z.string().trim().min(1, t?.errors.required).max(120),
    type: z.string().max(120),
    house: z.string().max(120),
    channel: z.string().max(80),
    value: z.number(t?.errors.amountRequired).min(0),
  });
}

export type HoldingFormValues = z.infer<
  ReturnType<typeof createHoldingFormSchema>
>;

export function createDepositsFormSchema() {
  return z.object({
    value: z.number().optional(),
  });
}

export type DepositsFormValues = z.infer<
  ReturnType<typeof createDepositsFormSchema>
>;
