import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  yearSchema,
  monthSchema,
  monthYearSchema,
  monthIndex,
  EndSelections,
} from "@/lib/schemas/common";

export const IncomeTypes = {
  Fixed: "FIXED",
  OneTime: "ONE_TIME",
} as const;

export type IncomeTypeValue = (typeof IncomeTypes)[keyof typeof IncomeTypes];

export const ApplyModes = {
  Permanent: "permanent",
  Month: "month",
} as const;

export type ApplyMode = (typeof ApplyModes)[keyof typeof ApplyModes];

const amountSchema = z.number().min(0).max(999_999_999);
export const incomeNameSchema = z.string().min(1).max(100);
const nameSchema = incomeNameSchema;
const noteSchema = z.string().max(500).optional().nullable();

export const monthInputSchema = z.object({
  year: yearSchema,
  month: monthSchema,
});

export type MonthInput = z.infer<typeof monthInputSchema>;

export const createSourceSchema = z.object({
  name: nameSchema,
  amount: amountSchema,
  year: yearSchema,
  month: monthSchema,
  note: noteSchema,
  endYear: yearSchema.optional().nullable(),
  endMonth: monthSchema.optional().nullable(),
});

export type CreateSourceInput = z.infer<typeof createSourceSchema>;

export const raiseSchema = z.object({
  year: yearSchema,
  month: monthSchema,
  amount: amountSchema,
  note: noteSchema,
});

export type RaiseInput = z.infer<typeof raiseSchema>;

export const overrideSchema = z.object({
  year: yearSchema,
  month: monthSchema,
  amount: amountSchema,
  note: noteSchema,
});

export type OverrideInput = z.infer<typeof overrideSchema>;

export const oneTimeSchema = z.object({
  name: nameSchema,
  year: yearSchema,
  month: monthSchema,
  amount: amountSchema,
  note: noteSchema,
});

export type OneTimeInput = z.infer<typeof oneTimeSchema>;

export const updateEntryAmountSchema = z.object({
  amount: amountSchema,
  note: noteSchema,
});

export type UpdateEntryAmountInput = z.infer<typeof updateEntryAmountSchema>;

export function createIncomeFormSchema(t?: Dictionary) {
  return z
    .object({
      type: z.enum([IncomeTypes.Fixed, IncomeTypes.OneTime]),
      name: z.string().trim().min(1, t?.errors.required).max(100),
      amount: z
        .number(t?.errors.amountRequired)
        .min(0, t?.errors.amountPositive)
        .max(999_999_999),
      start: monthYearSchema,
      hasEnd: z.enum([EndSelections.None, EndSelections.Custom]),
      end: monthYearSchema,
      note: z.string().max(500),
    })
    .superRefine((v, ctx) => {
      if (
        v.type === IncomeTypes.Fixed &&
        v.hasEnd === EndSelections.Custom &&
        monthIndex(v.end) < monthIndex(v.start)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["end"],
          message: t?.errors.endBeforeStart ?? "End before start",
        });
      }
    });
}

export type IncomeFormValues = z.infer<
  ReturnType<typeof createIncomeFormSchema>
>;

export function createEditSourceFormSchema(t?: Dictionary) {
  return z.object({
    name: z.string().trim().min(1, t?.errors.required).max(100),
    amount: z
      .number(t?.errors.amountRequired)
      .min(0, t?.errors.amountPositive)
      .max(999_999_999),
    applyMode: z.enum([ApplyModes.Permanent, ApplyModes.Month]),
    from: monthYearSchema,
    hasEnd: z.enum([EndSelections.None, EndSelections.Custom]),
    end: monthYearSchema,
  });
}

export type EditSourceFormValues = z.infer<
  ReturnType<typeof createEditSourceFormSchema>
>;

export function createOverrideFormSchema(t?: Dictionary) {
  return z.object({
    amount: z
      .number(t?.errors.amountRequired)
      .min(0, t?.errors.amountPositive)
      .max(999_999_999),
  });
}

export type OverrideFormValues = z.infer<
  ReturnType<typeof createOverrideFormSchema>
>;

export function createEndSourceFormSchema() {
  return z.object({
    end: monthYearSchema,
  });
}

export type EndSourceFormValues = z.infer<
  ReturnType<typeof createEndSourceFormSchema>
>;
