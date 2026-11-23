import { z } from "zod";
import { yearSchema, monthSchema } from "@/lib/validate";

export { idSchema, yearSchema, monthSchema } from "@/lib/validate";

export const monthYearSchema = z.object({
  year: yearSchema,
  month: monthSchema,
});

export type MonthYear = z.infer<typeof monthYearSchema>;

export function monthIndex(value: MonthYear): number {
  return value.year * 12 + value.month;
}

export const EndSelections = {
  None: "none",
  Custom: "custom",
} as const;

export type EndSelection =
  (typeof EndSelections)[keyof typeof EndSelections];
