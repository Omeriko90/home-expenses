"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { idSchema } from "@/lib/validate";

const schema = z.object({
  date: z.string().min(1), // ISO date
  businessName: z.string().min(1).max(200),
  amount: z.number(),
  categoryId: z.string().min(1),
  kind: z.enum(["FIXED", "VARIABLE"]),
  note: z.string().max(500).optional().nullable(),
});

export type TransactionInput = z.infer<typeof schema>;

// The category FK is not household-scoped at the DB level — verify ownership
// before writing, as in upsertBudget.
async function assertCategoryInHousehold(
  categoryId: string,
  householdId: string,
) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, householdId },
    select: { id: true },
  });
  if (!category) throw new Error("Category not found");
}

export async function createTransaction(input: TransactionInput) {
  const user = await requireUser();
  const data = schema.parse(input);
  await assertCategoryInHousehold(data.categoryId, user.householdId);
  const date = new Date(data.date);
  await prisma.transaction.create({
    data: {
      date,
      businessName: data.businessName,
      amount: data.amount,
      categoryId: data.categoryId,
      kind: data.kind,
      note: data.note ?? null,
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      createdByUserId: user.id,
      householdId: user.householdId,
    },
  });
  revalidatePath("/transactions");
  return { ok: true as const };
}

export async function updateTransaction(id: string, input: TransactionInput) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  const data = schema.parse(input);
  await assertCategoryInHousehold(data.categoryId, householdId);
  const date = new Date(data.date);
  await prisma.transaction.update({
    where: { id, householdId },
    data: {
      date,
      businessName: data.businessName,
      amount: data.amount,
      categoryId: data.categoryId,
      kind: data.kind,
      note: data.note ?? null,
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
    },
  });
  revalidatePath("/transactions");
  return { ok: true as const };
}

export async function deleteTransaction(id: string) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  await prisma.transaction.delete({ where: { id, householdId } });
  revalidatePath("/transactions");
  return { ok: true as const };
}
