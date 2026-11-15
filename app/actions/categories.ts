"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

const schema = z.object({
  name: z.string().min(1).max(80),
  nameEn: z.string().max(80).optional().nullable(),
  description: z.string().max(200).optional().nullable(),
  type: z.enum(["EXPENSE", "INVESTMENT"]),
  color: z.string().max(20).optional().nullable(),
});

export type CategoryInput = z.infer<typeof schema>;

export async function createCategory(input: CategoryInput) {
  await requireUser();
  const data = schema.parse(input);
  const existing = await prisma.category.findUnique({ where: { name: data.name } });
  if (existing) return { error: "duplicate" as const };
  await prisma.category.create({ data });
  revalidatePath("/categories");
  return { ok: true as const };
}

export async function updateCategory(id: string, input: CategoryInput) {
  await requireUser();
  const data = schema.parse(input);
  await prisma.category.update({ where: { id }, data });
  revalidatePath("/categories");
  return { ok: true as const };
}

export async function deleteCategory(id: string) {
  await requireUser();
  const count = await prisma.transaction.count({ where: { categoryId: id } });
  if (count > 0) {
    // Keep historical data intact — archive instead of hard-delete.
    await prisma.category.update({ where: { id }, data: { archived: true } });
    revalidatePath("/categories");
    return { archived: true as const };
  }
  await prisma.budget.deleteMany({ where: { categoryId: id } });
  await prisma.businessMapping.deleteMany({ where: { categoryId: id } });
  await prisma.category.delete({ where: { id } });
  revalidatePath("/categories");
  return { ok: true as const };
}

export async function setCategoryArchived(id: string, archived: boolean) {
  await requireUser();
  await prisma.category.update({ where: { id }, data: { archived } });
  revalidatePath("/categories");
  return { ok: true as const };
}
