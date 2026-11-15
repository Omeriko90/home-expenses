"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

const schema = z.object({
  date: z.string().min(1), // ISO date
  businessName: z.string().min(1).max(200),
  amount: z.number(),
  categoryId: z.string().min(1),
  kind: z.enum(["FIXED", "VARIABLE"]),
  note: z.string().max(500).optional().nullable(),
});

export type TransactionInput = z.infer<typeof schema>;

export async function createTransaction(input: TransactionInput) {
  const user = await requireUser();
  const data = schema.parse(input);
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
    },
  });
  revalidatePath("/transactions");
  return { ok: true as const };
}

export async function updateTransaction(id: string, input: TransactionInput) {
  await requireUser();
  const data = schema.parse(input);
  const date = new Date(data.date);
  await prisma.transaction.update({
    where: { id },
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
  await requireUser();
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/transactions");
  return { ok: true as const };
}
