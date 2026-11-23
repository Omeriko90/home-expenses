"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { idSchema, yearSchema } from "@/lib/validate";
import { PlannedItemStatuses, PlannedItemTypes } from "@/lib/forecast";

const monthSchema = z.number().int().min(1).max(12);

// Absolute month index — lets start/end pairs that cross year boundaries be
// compared chronologically as plain numbers.
function toMonthIndex(year: number, month: number): number {
  return year * 12 + month;
}

const plannedItemSchema = z
  .object({
    title: z.string().min(1).max(200),
    type: z.enum([
      PlannedItemTypes.OneTime,
      PlannedItemTypes.Recurring,
      PlannedItemTypes.Installments,
    ]),
    amount: z.number().positive(),
    installments: z.number().int().min(2).max(120).optional().nullable(),
    startYear: yearSchema,
    startMonth: monthSchema,
    endYear: yearSchema.optional().nullable(),
    endMonth: monthSchema.optional().nullable(),
    note: z.string().max(500).optional().nullable(),
    categoryId: idSchema.optional().nullable(),
  })
  .superRefine((input, ctx) => {
    if (input.type === PlannedItemTypes.Installments && !input.installments) {
      ctx.addIssue({
        code: "custom",
        path: ["installments"],
        message: "installments required",
      });
    }
    if (
      input.type === PlannedItemTypes.Recurring &&
      input.endYear != null &&
      input.endMonth != null &&
      toMonthIndex(input.endYear, input.endMonth) <
        toMonthIndex(input.startYear, input.startMonth)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endMonth"],
        message: "end before start",
      });
    }
  });

export type PlannedItemInput = z.infer<typeof plannedItemSchema>;

const statusSchema = z.enum([
  PlannedItemStatuses.Active,
  PlannedItemStatuses.Done,
  PlannedItemStatuses.Cancelled,
]);

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

function mapInputToPlannedItemData(input: PlannedItemInput) {
  const isRecurring = input.type === PlannedItemTypes.Recurring;
  return {
    title: input.title,
    type: input.type,
    amount: input.amount,
    installments:
      input.type === PlannedItemTypes.Installments ? input.installments : null,
    startYear: input.startYear,
    startMonth: input.startMonth,
    endYear: isRecurring ? (input.endYear ?? null) : null,
    endMonth: isRecurring ? (input.endMonth ?? null) : null,
    note: input.note ?? null,
    categoryId: input.categoryId ?? null,
  };
}

export async function createPlannedItem(rawInput: PlannedItemInput) {
  const { householdId } = await requireUser();
  const input = plannedItemSchema.parse(rawInput);
  if (input.categoryId)
    await assertCategoryInHousehold(input.categoryId, householdId);
  await prisma.plannedItem.create({
    data: { ...mapInputToPlannedItemData(input), householdId },
  });
  revalidatePath("/planning");
  return { ok: true as const };
}

export async function updatePlannedItem(id: string, rawInput: PlannedItemInput) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  const input = plannedItemSchema.parse(rawInput);
  if (input.categoryId)
    await assertCategoryInHousehold(input.categoryId, householdId);
  await prisma.plannedItem.update({
    where: { id, householdId },
    data: mapInputToPlannedItemData(input),
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
