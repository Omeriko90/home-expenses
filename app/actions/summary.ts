"use server";

import { z } from "zod";
import { requireUser } from "@/lib/session";
import {
  getCategoryMonthlySpend,
  type CategoryMonthlySpend,
} from "@/lib/summary";

const schema = z.object({
  categoryId: z.string().min(1),
  year: z.number().int(),
});

/** Lazy-loaded monthly breakdown for the summary accordion. */
export async function fetchCategoryMonthlySpend(
  categoryId: string,
  year: number,
): Promise<CategoryMonthlySpend> {
  const { householdId } = await requireUser();
  const input = schema.parse({ categoryId, year });
  return getCategoryMonthlySpend(input.categoryId, input.year, householdId);
}
