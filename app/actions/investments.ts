"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { idSchema } from "@/lib/validate";
import { holdingSchema, type HoldingInput } from "@/lib/schemas/investments";
import {
  transactionSchema,
  type TransactionInput,
} from "@/lib/schemas/transactions";

export type { HoldingInput };

export async function upsertHolding(input: HoldingInput) {
  const { householdId } = await requireUser();
  const d = holdingSchema.parse(input);
  // Holdings are scoped through their portfolio.
  const portfolio = await prisma.portfolio.findFirst({
    where: { id: d.portfolioId, householdId },
    select: { id: true },
  });
  if (!portfolio) return { error: "notFound" as const };

  // Reuse an existing type's exact spelling when the typed value only
  // differs by case/whitespace, so free text can't create duplicates.
  let type = d.type.trim().replace(/\s+/g, " ");
  if (type) {
    const existing = await prisma.holding.findFirst({
      where: {
        portfolio: { householdId },
        type: { equals: type, mode: "insensitive" },
      },
      select: { type: true },
    });
    if (existing) type = existing.type;
  }

  let holdingId = d.holdingId ?? null;
  if (holdingId) {
    await prisma.holding.update({
      where: { id: holdingId, portfolio: { householdId } },
      data: {
        channel: d.channel,
        instrument: d.instrument,
        house: d.house,
        type,
      },
    });
  } else {
    const h = await prisma.holding.create({
      data: {
        portfolioId: d.portfolioId,
        channel: d.channel,
        instrument: d.instrument,
        house: d.house,
        type,
      },
    });
    holdingId = h.id;
  }
  await prisma.holdingSnapshot.upsert({
    where: { holdingId_year: { holdingId, year: d.year } },
    update: { value: d.value },
    create: { holdingId, year: d.year, value: d.value },
  });
  revalidatePath("/investments");
  return { ok: true as const };
}

export async function deleteHolding(holdingId: string) {
  const { householdId } = await requireUser();
  idSchema.parse(holdingId);
  await prisma.holding.delete({
    where: { id: holdingId, portfolio: { householdId } },
  });
  revalidatePath("/investments");
  return { ok: true as const };
}

// Deposits are regular transactions tagged with an INVESTMENT category and
// linked to a portfolio; their sum per year is the portfolio's deposits figure.
async function assertDepositContext(
  portfolioId: string,
  categoryId: string,
  householdId: string,
) {
  const portfolio = await prisma.portfolio.findFirst({
    where: { id: portfolioId, householdId },
    select: { id: true },
  });
  if (!portfolio) throw new Error("Portfolio not found");
  const category = await prisma.category.findFirst({
    where: { id: categoryId, householdId, type: "INVESTMENT" },
    select: { id: true },
  });
  if (!category) throw new Error("Investment category not found");
}

export async function createDeposit(
  portfolioId: string,
  input: TransactionInput,
) {
  const user = await requireUser();
  idSchema.parse(portfolioId);
  const data = transactionSchema.parse(input);
  await assertDepositContext(portfolioId, data.categoryId, user.householdId);
  const date = new Date(data.date);
  await prisma.transaction.create({
    data: {
      date,
      businessName: data.businessName,
      amount: data.amount,
      categoryId: data.categoryId,
      kind: "VARIABLE",
      note: data.note ?? null,
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      portfolioId,
      createdByUserId: user.id,
      householdId: user.householdId,
    },
  });
  revalidatePath("/investments");
  return { ok: true as const };
}

export async function updateDeposit(id: string, input: TransactionInput) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  const data = transactionSchema.parse(input);
  const existing = await prisma.transaction.findFirst({
    where: { id, householdId },
    select: { portfolioId: true },
  });
  if (!existing?.portfolioId) return { error: "notFound" as const };
  await assertDepositContext(existing.portfolioId, data.categoryId, householdId);
  const date = new Date(data.date);
  await prisma.transaction.update({
    where: { id, householdId },
    data: {
      date,
      businessName: data.businessName,
      amount: data.amount,
      categoryId: data.categoryId,
      kind: "VARIABLE",
      note: data.note ?? null,
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
    },
  });
  revalidatePath("/investments");
  return { ok: true as const };
}

export async function deleteDeposit(id: string) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  await prisma.transaction.delete({
    where: { id, householdId, portfolioId: { not: null } },
  });
  revalidatePath("/investments");
  return { ok: true as const };
}

export async function createPortfolio(name: string, group: "MAIN" | "KIDS") {
  const { householdId } = await requireUser();
  name = z.string().min(1).max(120).parse(name);
  z.enum(["MAIN", "KIDS"]).parse(group);
  await prisma.portfolio.create({ data: { name, group, householdId } });
  revalidatePath("/investments");
  return { ok: true as const };
}
