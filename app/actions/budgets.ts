"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

const schema = z.object({
  categoryId: z.string().min(1),
  year: z.number().int(),
  monthlyAmount: z.number().min(0),
});

export async function upsertBudget(input: z.infer<typeof schema>) {
  await requireUser();
  const { categoryId, year, monthlyAmount } = schema.parse(input);
  await prisma.budget.upsert({
    where: { categoryId_year: { categoryId, year } },
    update: { monthlyAmount },
    create: { categoryId, year, monthlyAmount },
  });
  revalidatePath("/budgets");
  return { ok: true as const };
}

export async function copyBudgetsFromPreviousYear(year: number) {
  await requireUser();
  const prev = await prisma.budget.findMany({ where: { year: year - 1 } });
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
