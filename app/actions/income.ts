"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { idSchema, monthSchema, yearSchema } from "@/lib/validate";

const amountSchema = z.number().min(0).max(999_999_999);
const nameSchema = z.string().min(1).max(100);
const noteSchema = z.string().max(500).optional().nullable();

const monthInputSchema = z.object({
  year: yearSchema,
  month: monthSchema,
});

function revalidateIncome() {
  revalidatePath("/income");
  revalidatePath("/dashboard");
  revalidatePath("/planning");
}

// The source FK is not household-scoped at the DB level — verify ownership
// before writing, as in createTransaction's category check.
async function assertSourceInHousehold(sourceId: string, householdId: string) {
  const source = await prisma.incomeSource.findFirst({
    where: { id: sourceId, householdId },
    select: { id: true },
  });
  if (!source) throw new Error("Income source not found");
}

function isUniqueViolation(e: unknown) {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
}

const createSourceSchema = z.object({
  name: nameSchema,
  amount: amountSchema,
  year: yearSchema,
  month: monthSchema,
  note: noteSchema,
  endYear: yearSchema.optional().nullable(),
  endMonth: monthSchema.optional().nullable(),
});

export type CreateSourceInput = z.infer<typeof createSourceSchema>;

/** Create a recurring income source with its first FIXED amount. */
export async function createIncomeSource(input: CreateSourceInput) {
  const { householdId } = await requireUser();
  const data = createSourceSchema.parse(input);
  try {
    await prisma.incomeSource.create({
      data: {
        name: data.name,
        endYear: data.endYear ?? null,
        endMonth: data.endMonth ?? null,
        householdId,
        entries: {
          create: {
            kind: "FIXED",
            year: data.year,
            month: data.month,
            amount: data.amount,
            note: data.note ?? null,
            householdId,
          },
        },
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: "duplicateName" as const };
    throw e;
  }
  revalidateIncome();
  return { ok: true as const };
}

export async function renameIncomeSource(id: string, name: string) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  name = nameSchema.parse(name);
  try {
    const { count } = await prisma.incomeSource.updateMany({
      where: { id, householdId },
      data: { name },
    });
    if (count === 0) return { error: "notFound" as const };
  } catch (e) {
    if (isUniqueViolation(e)) return { error: "duplicateName" as const };
    throw e;
  }
  revalidateIncome();
  return { ok: true as const };
}

const raiseSchema = z.object({
  year: yearSchema,
  month: monthSchema,
  amount: amountSchema,
  note: noteSchema,
});

export type RaiseInput = z.infer<typeof raiseSchema>;

/** Set a new FIXED amount from a given month onward (a raise). */
export async function addRaise(sourceId: string, input: RaiseInput) {
  const { householdId } = await requireUser();
  idSchema.parse(sourceId);
  const data = raiseSchema.parse(input);
  await assertSourceInHousehold(sourceId, householdId);
  await prisma.incomeEntry.upsert({
    where: {
      sourceId_year_month_kind: {
        sourceId,
        year: data.year,
        month: data.month,
        kind: "FIXED",
      },
    },
    create: {
      kind: "FIXED",
      year: data.year,
      month: data.month,
      amount: data.amount,
      note: data.note ?? null,
      sourceId,
      householdId,
    },
    update: { amount: data.amount, note: data.note ?? null },
  });
  revalidateIncome();
  return { ok: true as const };
}

const overrideSchema = z.object({
  year: yearSchema,
  month: monthSchema,
  amount: amountSchema,
  note: noteSchema,
});

export type OverrideInput = z.infer<typeof overrideSchema>;

/** Replace a source's amount for exactly one month. */
export async function setMonthOverride(sourceId: string, input: OverrideInput) {
  const { householdId } = await requireUser();
  idSchema.parse(sourceId);
  const data = overrideSchema.parse(input);
  await assertSourceInHousehold(sourceId, householdId);
  await prisma.incomeEntry.upsert({
    where: {
      sourceId_year_month_kind: {
        sourceId,
        year: data.year,
        month: data.month,
        kind: "OVERRIDE",
      },
    },
    create: {
      kind: "OVERRIDE",
      year: data.year,
      month: data.month,
      amount: data.amount,
      note: data.note ?? null,
      sourceId,
      householdId,
    },
    update: { amount: data.amount, note: data.note ?? null },
  });
  revalidateIncome();
  return { ok: true as const };
}

export async function clearMonthOverride(
  sourceId: string,
  input: z.infer<typeof monthInputSchema>,
) {
  const { householdId } = await requireUser();
  idSchema.parse(sourceId);
  const { year, month } = monthInputSchema.parse(input);
  await prisma.incomeEntry.deleteMany({
    where: { sourceId, year, month, kind: "OVERRIDE", householdId },
  });
  revalidateIncome();
  return { ok: true as const };
}

/** The source stops counting after this month (inclusive); history is kept. */
export async function endIncomeSource(
  id: string,
  input: z.infer<typeof monthInputSchema>,
) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  const { year, month } = monthInputSchema.parse(input);
  const { count } = await prisma.incomeSource.updateMany({
    where: { id, householdId },
    data: { endYear: year, endMonth: month },
  });
  if (count === 0) return { error: "notFound" as const };
  revalidateIncome();
  return { ok: true as const };
}

export async function reactivateIncomeSource(id: string) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  const { count } = await prisma.incomeSource.updateMany({
    where: { id, householdId },
    data: { endYear: null, endMonth: null },
  });
  if (count === 0) return { error: "notFound" as const };
  revalidateIncome();
  return { ok: true as const };
}

export async function deleteIncomeSource(id: string) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  await prisma.incomeSource.deleteMany({ where: { id, householdId } });
  revalidateIncome();
  return { ok: true as const };
}

const oneTimeSchema = z.object({
  name: nameSchema,
  year: yearSchema,
  month: monthSchema,
  amount: amountSchema,
  note: noteSchema,
});

export type OneTimeInput = z.infer<typeof oneTimeSchema>;

/** A standalone income for one month (tax refund, gift...). */
export async function createOneTimeIncome(input: OneTimeInput) {
  const { householdId } = await requireUser();
  const data = oneTimeSchema.parse(input);
  await prisma.incomeEntry.create({
    data: {
      kind: "ONE_TIME",
      name: data.name,
      year: data.year,
      month: data.month,
      amount: data.amount,
      note: data.note ?? null,
      householdId,
    },
  });
  revalidateIncome();
  return { ok: true as const };
}

const updateOneTimeSchema = oneTimeSchema;

export async function updateOneTimeIncome(
  id: string,
  input: z.infer<typeof updateOneTimeSchema>,
) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  const data = updateOneTimeSchema.parse(input);
  const { count } = await prisma.incomeEntry.updateMany({
    where: { id, householdId, kind: "ONE_TIME" },
    data: {
      name: data.name,
      year: data.year,
      month: data.month,
      amount: data.amount,
      note: data.note ?? null,
    },
  });
  if (count === 0) return { error: "notFound" as const };
  revalidateIncome();
  return { ok: true as const };
}

const updateEntryAmountSchema = z.object({
  amount: amountSchema,
  note: noteSchema,
});

/** Edit the amount/note of an existing FIXED or OVERRIDE entry in place. */
export async function updateIncomeEntryAmount(
  id: string,
  input: z.infer<typeof updateEntryAmountSchema>,
) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  const data = updateEntryAmountSchema.parse(input);
  const { count } = await prisma.incomeEntry.updateMany({
    where: { id, householdId, kind: { in: ["FIXED", "OVERRIDE"] } },
    data: { amount: data.amount, note: data.note ?? null },
  });
  if (count === 0) return { error: "notFound" as const };
  revalidateIncome();
  return { ok: true as const };
}

export async function deleteIncomeEntry(id: string) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  await prisma.incomeEntry.deleteMany({ where: { id, householdId } });
  revalidateIncome();
  return { ok: true as const };
}
