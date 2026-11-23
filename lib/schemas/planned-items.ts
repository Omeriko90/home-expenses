import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { PlannedItemStatuses, PlannedItemTypes } from "@/lib/forecast";
import {
  idSchema,
  yearSchema,
  monthSchema,
  monthYearSchema,
  monthIndex,
  EndSelections,
} from "@/lib/schemas/common";

const statusSchema = z.enum([
  PlannedItemStatuses.Active,
  PlannedItemStatuses.Done,
  PlannedItemStatuses.Cancelled,
]);

export const plannedItemSchema = z
  .object({
    title: z.string().min(1).max(200),
    type: z.enum([
      PlannedItemTypes.OneTime,
      PlannedItemTypes.Recurring,
      PlannedItemTypes.Installments,
    ]),
    status: statusSchema.optional(),
    amount: z.number().positive(),
    installments: z.number().int().min(2).max(120).optional().nullable(),
    startYear: yearSchema,
    startMonth: monthSchema,
    endYear: yearSchema.optional().nullable(),
    endMonth: monthSchema.optional().nullable(),
    note: z.string().max(500).optional().nullable(),
    categoryId: idSchema.optional().nullable(),
  })
  .superRefine((input, ctx) => {
    if (input.type === PlannedItemTypes.Installments && !input.installments) {
      ctx.addIssue({
        code: "custom",
        path: ["installments"],
        message: "installments required",
      });
    }
    if (
      input.type === PlannedItemTypes.Recurring &&
      input.endYear != null &&
      input.endMonth != null &&
      input.endYear * 12 + input.endMonth <
        input.startYear * 12 + input.startMonth
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endMonth"],
        message: "end before start",
      });
    }
  });

export type PlannedItemInput = z.infer<typeof plannedItemSchema>;

export function createPlannedItemFormSchema(t?: Dictionary) {
  return z
    .object({
      title: z.string().trim().min(1, t?.errors.required).max(200),
      type: z.enum([
        PlannedItemTypes.OneTime,
        PlannedItemTypes.Recurring,
        PlannedItemTypes.Installments,
      ]),
      amount: z
        .number(t?.errors.amountRequired)
        .positive(t?.errors.amountPositive),
      installments: z
        .number()
        .int()
        .min(2, t?.errors.installmentsMin)
        .max(120)
        .optional(),
      start: monthYearSchema,
      endSelection: z.string(),
      end: monthYearSchema,
      categoryId: z.string(),
      note: z.string().max(500),
    })
    .superRefine((v, ctx) => {
      if (v.type === PlannedItemTypes.Installments && v.installments == null) {
        ctx.addIssue({
          code: "custom",
          path: ["installments"],
          message: t?.errors.required ?? "Required",
        });
      }
      if (
        v.type === PlannedItemTypes.Recurring &&
        v.endSelection === EndSelections.Custom &&
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

export type PlannedItemFormValues = z.infer<
  ReturnType<typeof createPlannedItemFormSchema>
>;
