"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { yearSchema } from "@/lib/validate";

const schema = z.object({
  categoryId: z.string().min(1),
  year: z.number().int(),
  monthlyAmount: z.number().min(0),
});

export async function upsertBudget(input: z.infer<typeof schema>) {
  const { householdId } = await requireUser();
  const { categoryId, year, monthlyAmount } = schema.parse(input);
  // Budget is scoped through its category — verify it belongs to the household.
  const category = await prisma.category.findFirst({
    where: { id: categoryId, householdId },
    select: { id: true },
  });
  if (!category) return { error: "notFound" as const };
  await prisma.budget.upsert({
    where: { categoryId_year: { categoryId, year } },
    update: { monthlyAmount },
    create: { categoryId, year, monthlyAmount },
  });
  revalidatePath("/budgets");
  return { ok: true as const };
}

export async function copyBudgetsFromPreviousYear(year: number) {
  const { householdId } = await requireUser();
  yearSchema.parse(year);
  const prev = await prisma.budget.findMany({
    where: { year: year - 1, category: { householdId } },
  });
  for (const b of prev) {
    await prisma.budget.upsert({
      where: { categoryId_year: { categoryId: b.categoryId, year } },
      update: {},
      create: {
        categoryId: b.categoryId,
        year,
        monthlyAmount: b.monthlyAmount,
      },
    });
  }
  revalidatePath("/budgets");
  return { copied: prev.length };
}
