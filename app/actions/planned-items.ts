"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { idSchema, yearSchema } from "@/lib/validate";

const monthSchema = z.number().int().min(1).max(12);

const plannedItemSchema = z
  .object({
    title: z.string().min(1).max(200),
    type: z.enum(["ONE_TIME", "RECURRING", "INSTALLMENTS"]),
    amount: z.number().positive(),
    installments: z.number().int().min(2).max(120).optional().nullable(),
    startYear: yearSchema,
    startMonth: monthSchema,
    endYear: yearSchema.optional().nullable(),
    endMonth: monthSchema.optional().nullable(),
    note: z.string().max(500).optional().nullable(),
    categoryId: idSchema.optional().nullable(),
  })
  .superRefine((d, ctx) => {
    if (d.type === "INSTALLMENTS" && !d.installments) {
      ctx.addIssue({
        code: "custom",
        path: ["installments"],
        message: "installments required",
      });
    }
    if (d.type === "RECURRING" && d.endYear != null && d.endMonth != null) {
      const start = d.startYear * 12 + d.startMonth;
      const end = d.endYear * 12 + d.endMonth;
      if (end < start) {
        ctx.addIssue({
          code: "custom",
          path: ["endMonth"],
          message: "end before start",
        });
      }
    }
  });

export type PlannedItemInput = z.infer<typeof plannedItemSchema>;

const statusSchema = z.enum(["ACTIVE", "DONE", "CANCELLED"]);

// The category FK is not household-scoped at the DB level — verify ownership
// before writing, as in createTransaction.
async function assertCategoryInHousehold(
  categoryId: string,
  householdId: string,
) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, householdId, type: "EXPENSE" },
    select: { id: true },
  });
  if (!category) throw new Error("Category not found");
}

function toData(d: PlannedItemInput) {
  const recurring = d.type === "RECURRING";
  return {
    title: d.title,
    type: d.type,
    amount: d.amount,
    installments: d.type === "INSTALLMENTS" ? d.installments : null,
    startYear: d.startYear,
    startMonth: d.startMonth,
    endYear: recurring ? (d.endYear ?? null) : null,
    endMonth: recurring ? (d.endMonth ?? null) : null,
    note: d.note ?? null,
    categoryId: d.categoryId ?? null,
  };
}

export async function createPlannedItem(input: PlannedItemInput) {
  const { householdId } = await requireUser();
  const d = plannedItemSchema.parse(input);
  if (d.categoryId) await assertCategoryInHousehold(d.categoryId, householdId);
  await prisma.plannedItem.create({ data: { ...toData(d), householdId } });
  revalidatePath("/planning");
  return { ok: true as const };
}

export async function updatePlannedItem(id: string, input: PlannedItemInput) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  const d = plannedItemSchema.parse(input);
  if (d.categoryId) await assertCategoryInHousehold(d.categoryId, householdId);
  await prisma.plannedItem.update({
    where: { id, householdId },
    data: toData(d),
  });
  revalidatePath("/planning");
  return { ok: true as const };
}

export async function deletePlannedItem(id: string) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  await prisma.plannedItem.delete({ where: { id, householdId } });
  revalidatePath("/planning");
  return { ok: true as const };
}

export async function setPlannedItemStatus(
  id: string,
  status: z.infer<typeof statusSchema>,
) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  statusSchema.parse(status);
  await prisma.plannedItem.update({
    where: { id, householdId },
    data: { status },
  });
  revalidatePath("/planning");
  return { ok: true as const };
}
