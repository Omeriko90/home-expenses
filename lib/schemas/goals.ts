import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export const GoalTypes = {
  Numeric: "NUMERIC",
  Checklist: "CHECKLIST",
} as const;

export type GoalTypeValue = (typeof GoalTypes)[keyof typeof GoalTypes];

export const GoalLinkKinds = {
  None: "NONE",
  Category: "CATEGORY",
  InvestmentTotal: "INVESTMENT_TOTAL",
} as const;

export type GoalLinkKindValue =
  (typeof GoalLinkKinds)[keyof typeof GoalLinkKinds];

export const goalSchema = z.object({
  title: z.string().min(1).max(200),
  year: z.number().int(),
  type: z.enum([GoalTypes.Numeric, GoalTypes.Checklist]),
  note: z.string().max(500).optional().nullable(),
  targetAmount: z.number().optional().nullable(),
  currentAmount: z.number().optional().nullable(),
  linkKind: z
    .enum([GoalLinkKinds.None, GoalLinkKinds.Category, GoalLinkKinds.InvestmentTotal])
    .default(GoalLinkKinds.None),
  linkCategoryId: z.string().optional().nullable(),
  milestones: z.array(z.string()).optional(),
});

export type GoalInput = z.infer<typeof goalSchema>;

export function createGoalFormSchema(t?: Dictionary) {
  return z
    .object({
      title: z.string().trim().min(1, t?.errors.required).max(200),
      type: z.enum([GoalTypes.Numeric, GoalTypes.Checklist]),
      linkKind: z.enum([
        GoalLinkKinds.None,
        GoalLinkKinds.Category,
        GoalLinkKinds.InvestmentTotal,
      ]),
      linkCategoryId: z.string(),
      target: z.number().optional(),
      current: z.number().optional(),
      milestonesText: z.string(),
      note: z.string().max(500),
    })
    .superRefine((v, ctx) => {
      if (v.type === GoalTypes.Numeric && v.target == null) {
        ctx.addIssue({
          code: "custom",
          path: ["target"],
          message: t?.errors.required ?? "Required",
        });
      }
      if (
        v.type === GoalTypes.Numeric &&
        v.linkKind === GoalLinkKinds.Category &&
        !v.linkCategoryId
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["linkCategoryId"],
          message: t?.errors.required ?? "Required",
        });
      }
    });
}

export type GoalFormValues = z.infer<ReturnType<typeof createGoalFormSchema>>;
