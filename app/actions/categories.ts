"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { idSchema } from "@/lib/validate";
import { categorySchema, type CategoryInput } from "@/lib/schemas/categories";

export type { CategoryInput };

export async function createCategory(input: CategoryInput) {
  const { householdId } = await requireUser();
  const data = categorySchema.parse(input);
  const existing = await prisma.category.findUnique({
    where: { householdId_name: { householdId, name: data.name } },
  });
  if (existing) return { error: "duplicate" as const };
  await prisma.category.create({ data: { ...data, householdId } });
  revalidatePath("/categories");
  return { ok: true as const };
}

export async function updateCategory(id: string, input: CategoryInput) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  const data = categorySchema.parse(input);
  await prisma.category.update({ where: { id, householdId }, data });
  revalidatePath("/categories");
  return { ok: true as const };
}

export async function deleteCategory(id: string) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  const count = await prisma.transaction.count({
    where: { categoryId: id, householdId },
  });
  if (count > 0) {
    // Keep historical data intact — archive instead of hard-delete.
    await prisma.category.update({
      where: { id, householdId },
      data: { archived: true },
    });
    revalidatePath("/categories");
    return { archived: true as const };
  }
  await prisma.budget.deleteMany({
    where: { categoryId: id, category: { householdId } },
  });
  await prisma.businessMapping.deleteMany({
    where: { categoryId: id, householdId },
  });
  await prisma.category.delete({ where: { id, householdId } });
  revalidatePath("/categories");
  return { ok: true as const };
}

export async function setCategoryArchived(id: string, archived: boolean) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  await prisma.category.update({ where: { id, householdId }, data: { archived } });
  revalidatePath("/categories");
  return { ok: true as const };
}
