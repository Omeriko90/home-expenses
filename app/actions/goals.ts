"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

const goalSchema = z.object({
  title: z.string().min(1).max(200),
  year: z.number().int(),
  type: z.enum(["NUMERIC", "CHECKLIST"]),
  note: z.string().max(500).optional().nullable(),
  targetAmount: z.number().optional().nullable(),
  currentAmount: z.number().optional().nullable(),
  linkKind: z.enum(["NONE", "CATEGORY", "INVESTMENT_TOTAL"]).default("NONE"),
  linkCategoryId: z.string().optional().nullable(),
  milestones: z.array(z.string()).optional(),
});

export type GoalInput = z.infer<typeof goalSchema>;

export async function createGoal(input: GoalInput) {
  await requireUser();
  const d = goalSchema.parse(input);
  await prisma.goal.create({
    data: {
      title: d.title,
      year: d.year,
      type: d.type,
      note: d.note ?? null,
      targetAmount: d.type === "NUMERIC" ? (d.targetAmount ?? 0) : null,
      currentAmount:
        d.type === "NUMERIC" && d.linkKind === "NONE"
          ? (d.currentAmount ?? 0)
          : null,
      linkKind: d.type === "NUMERIC" ? d.linkKind : "NONE",
      linkCategoryId: d.linkKind === "CATEGORY" ? (d.linkCategoryId ?? null) : null,
      milestones:
        d.type === "CHECKLIST" && d.milestones
          ? {
              create: d.milestones
                .filter((m) => m.trim())
                .map((title, i) => ({ title: title.trim(), sortOrder: i })),
            }
          : undefined,
    },
  });
  revalidatePath("/goals");
  return { ok: true as const };
}

export async function updateGoal(id: string, input: GoalInput) {
  await requireUser();
  const d = goalSchema.parse(input);
  await prisma.goal.update({
    where: { id },
    data: {
      title: d.title,
      year: d.year,
      note: d.note ?? null,
      targetAmount: d.type === "NUMERIC" ? (d.targetAmount ?? 0) : null,
      currentAmount:
        d.type === "NUMERIC" && d.linkKind === "NONE"
          ? (d.currentAmount ?? 0)
          : null,
      linkKind: d.type === "NUMERIC" ? d.linkKind : "NONE",
      linkCategoryId: d.linkKind === "CATEGORY" ? (d.linkCategoryId ?? null) : null,
    },
  });
  revalidatePath("/goals");
  return { ok: true as const };
}

export async function deleteGoal(id: string) {
  await requireUser();
  await prisma.goal.delete({ where: { id } });
  revalidatePath("/goals");
  return { ok: true as const };
}

export async function toggleMilestone(id: string, done: boolean) {
  await requireUser();
  await prisma.goalMilestone.update({ where: { id }, data: { done } });
  revalidatePath("/goals");
  return { ok: true as const };
}

export async function addMilestone(goalId: string, title: string) {
  await requireUser();
  const count = await prisma.goalMilestone.count({ where: { goalId } });
  await prisma.goalMilestone.create({
    data: { goalId, title, sortOrder: count },
  });
  revalidatePath("/goals");
  return { ok: true as const };
}

export async function deleteMilestone(id: string) {
  await requireUser();
  await prisma.goalMilestone.delete({ where: { id } });
  revalidatePath("/goals");
  return { ok: true as const };
}
