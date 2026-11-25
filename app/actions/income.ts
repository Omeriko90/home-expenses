"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { idSchema } from "@/lib/validate";
import {
  monthInputSchema,
  createSourceSchema,
  raiseSchema,
  overrideSchema,
  oneTimeSchema,
  updateEntryAmountSchema,
  incomeNameSchema,
  taxParamsSchema,
  AmountTypes,
  type CreateSourceInput,
  type RaiseInput,
  type OverrideInput,
  type OneTimeInput,
  type UpdateEntryAmountInput,
  type TaxParamsInput,
} from "@/lib/schemas/income";
import { calcBonusNet, calcNetSalary } from "@/lib/tax/calc";
import type { TaxParams } from "@/lib/tax/types";
import { fetchIncomeData } from "@/lib/income";
import { monthKey, resolveMonthIncome } from "@/lib/income-resolve";

export type { CreateSourceInput, RaiseInput, OverrideInput, OneTimeInput };

function revalidateIncome() {
  revalidatePath("/income");
  revalidatePath("/dashboard");
  revalidatePath("/planning");
}

type SourceTaxContext = {
  id: string;
  amountType: "NET" | "GROSS";
  params: TaxParams;
};

// The source FK is not household-scoped at the DB level — verify ownership
// before writing, as in createTransaction's category check.
async function getSourceTaxContext(
  sourceId: string,
  householdId: string,
): Promise<SourceTaxContext> {
  const source = await prisma.incomeSource.findFirst({
    where: { id: sourceId, householdId },
    select: {
      id: true,
      amountType: true,
      creditPoints: true,
      pensionRate: true,
      hishtalmutRate: true,
      hishtalmutCapped: true,
    },
  });
  if (!source) throw new Error("Income source not found");
  return {
    id: source.id,
    amountType: source.amountType,
    params: {
      creditPoints: Number(source.creditPoints),
      pensionRate:
        source.pensionRate === null ? null : Number(source.pensionRate),
      hishtalmutRate:
        source.hishtalmutRate === null ? null : Number(source.hishtalmutRate),
      hishtalmutCapped: source.hishtalmutCapped,
    },
  };
}

function toEntryAmounts(
  amountInput: number,
  context: Pick<SourceTaxContext, "amountType" | "params">,
  year: number,
) {
  if (context.amountType !== AmountTypes.Gross) {
    return {
      amount: amountInput,
      grossAmount: null,
      taxBreakdown: Prisma.JsonNull,
    };
  }
  const breakdown = calcNetSalary(amountInput, context.params, year);
  return {
    amount: breakdown.net,
    grossAmount: amountInput,
    taxBreakdown: breakdown as unknown as Prisma.InputJsonValue,
  };
}

async function resolveBaseGross(
  householdId: string,
  linkedSourceId: string,
  year: number,
  month: number,
): Promise<number> {
  const { sources, entries } = await fetchIncomeData(householdId);
  const resolved = resolveMonthIncome(sources, entries, year, month);
  const line = resolved.sources.find(
    (resolvedSource) => resolvedSource.sourceId === linkedSourceId,
  );
  if (!line) return 0;
  const governing = entries.find((candidate) => candidate.id === line.entryId);
  return governing?.grossAmount ?? 0;
}

async function toOneTimeAmounts(
  data: OneTimeInput,
  householdId: string,
): Promise<
  | {
      amount: number;
      grossAmount: number | null;
      taxBreakdown: Prisma.InputJsonValue | typeof Prisma.JsonNull;
      linkedSourceId: string | null;
    }
  | { error: "notFound" }
> {
  if (!data.isGross) {
    return {
      amount: data.amount,
      grossAmount: null,
      taxBreakdown: Prisma.JsonNull,
      linkedSourceId: null,
    };
  }
  let baseGross = 0;
  let params: TaxParams = {
    creditPoints: 0,
    pensionRate: null,
    hishtalmutRate: null,
    hishtalmutCapped: true,
  };
  if (data.linkedSourceId) {
    const context = await getSourceTaxContext(data.linkedSourceId, householdId);
    if (context.amountType !== AmountTypes.Gross) return { error: "notFound" };
    params = context.params;
    baseGross = await resolveBaseGross(
      householdId,
      data.linkedSourceId,
      data.year,
      data.month,
    );
  }
  const breakdown = calcBonusNet(baseGross, data.amount, params, data.year);
  return {
    amount: breakdown.net,
    grossAmount: data.amount,
    taxBreakdown: breakdown as unknown as Prisma.InputJsonValue,
    linkedSourceId: data.linkedSourceId ?? null,
  };
}

function isUniqueViolation(e: unknown) {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
}

/** Create a recurring income source with its first FIXED amount. */
export async function createIncomeSource(input: CreateSourceInput) {
  const { householdId } = await requireUser();
  const data = createSourceSchema.parse(input);
  const entryAmounts = toEntryAmounts(
    data.amount,
    {
      amountType: data.amountType,
      params: {
        creditPoints: data.creditPoints,
        pensionRate: data.pensionRate,
        hishtalmutRate: data.hishtalmutRate,
        hishtalmutCapped: data.hishtalmutCapped,
      },
    },
    data.year,
  );
  try {
    await prisma.incomeSource.create({
      data: {
        name: data.name,
        endYear: data.endYear ?? null,
        endMonth: data.endMonth ?? null,
        amountType: data.amountType,
        creditPoints: data.creditPoints,
        pensionRate: data.pensionRate,
        hishtalmutRate: data.hishtalmutRate,
        hishtalmutCapped: data.hishtalmutCapped,
        householdId,
        entries: {
          create: {
            kind: "FIXED",
            year: data.year,
            month: data.month,
            ...entryAmounts,
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
  name = incomeNameSchema.parse(name);
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

/** Set a new FIXED amount from a given month onward (a raise). */
export async function addRaise(sourceId: string, input: RaiseInput) {
  const { householdId } = await requireUser();
  idSchema.parse(sourceId);
  const data = raiseSchema.parse(input);
  const context = await getSourceTaxContext(sourceId, householdId);
  const entryAmounts = toEntryAmounts(data.amount, context, data.year);
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
      ...entryAmounts,
      note: data.note ?? null,
      sourceId,
      householdId,
    },
    update: { ...entryAmounts, note: data.note ?? null },
  });
  revalidateIncome();
  return { ok: true as const };
}

/** Replace a source's amount for exactly one month. */
export async function setMonthOverride(sourceId: string, input: OverrideInput) {
  const { householdId } = await requireUser();
  idSchema.parse(sourceId);
  const data = overrideSchema.parse(input);
  const context = await getSourceTaxContext(sourceId, householdId);
  const entryAmounts = toEntryAmounts(data.amount, context, data.year);
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
      ...entryAmounts,
      note: data.note ?? null,
      sourceId,
      householdId,
    },
    update: { ...entryAmounts, note: data.note ?? null },
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

/** A standalone income for one month (tax refund, gift...). */
export async function createOneTimeIncome(input: OneTimeInput) {
  const { householdId } = await requireUser();
  const data = oneTimeSchema.parse(input);
  const amounts = await toOneTimeAmounts(data, householdId);
  if ("error" in amounts) return { error: amounts.error };
  await prisma.incomeEntry.create({
    data: {
      kind: "ONE_TIME",
      name: data.name,
      year: data.year,
      month: data.month,
      ...amounts,
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
  const amounts = await toOneTimeAmounts(data, householdId);
  if ("error" in amounts) return { error: amounts.error };
  const { count } = await prisma.incomeEntry.updateMany({
    where: { id, householdId, kind: "ONE_TIME" },
    data: {
      name: data.name,
      year: data.year,
      month: data.month,
      ...amounts,
      note: data.note ?? null,
    },
  });
  if (count === 0) return { error: "notFound" as const };
  revalidateIncome();
  return { ok: true as const };
}

/** Edit the amount/note of an existing FIXED or OVERRIDE entry in place. */
export async function updateIncomeEntryAmount(
  id: string,
  input: UpdateEntryAmountInput,
) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  const data = updateEntryAmountSchema.parse(input);
  const entry = await prisma.incomeEntry.findFirst({
    where: { id, householdId, kind: { in: ["FIXED", "OVERRIDE"] } },
    select: { id: true, year: true, sourceId: true },
  });
  if (!entry) return { error: "notFound" as const };
  const entryAmounts = entry.sourceId
    ? toEntryAmounts(
        data.amount,
        await getSourceTaxContext(entry.sourceId, householdId),
        entry.year,
      )
    : {
        amount: data.amount,
        grossAmount: null,
        taxBreakdown: Prisma.JsonNull,
      };
  await prisma.incomeEntry.update({
    where: { id: entry.id },
    data: { ...entryAmounts, note: data.note ?? null },
  });
  revalidateIncome();
  return { ok: true as const };
}

export async function updateIncomeSourceTaxParams(
  id: string,
  input: TaxParamsInput,
) {
  const { householdId } = await requireUser();
  idSchema.parse(id);
  const params = taxParamsSchema.parse(input);
  const source = await prisma.incomeSource.findFirst({
    where: { id, householdId },
    select: { id: true, amountType: true },
  });
  if (!source) return { error: "notFound" as const };
  const now = new Date();
  const nowKey = monthKey(now.getFullYear(), now.getMonth() + 1);
  await prisma.$transaction(async (tx) => {
    await tx.incomeSource.update({
      where: { id: source.id },
      data: {
        creditPoints: params.creditPoints,
        pensionRate: params.pensionRate,
        hishtalmutRate: params.hishtalmutRate,
        hishtalmutCapped: params.hishtalmutCapped,
      },
    });
    if (source.amountType !== AmountTypes.Gross) return;
    const entries = await tx.incomeEntry.findMany({
      where: {
        sourceId: source.id,
        kind: { in: ["FIXED", "OVERRIDE"] },
        grossAmount: { not: null },
      },
      select: { id: true, year: true, month: true, grossAmount: true },
    });
    for (const entry of entries) {
      if (monthKey(entry.year, entry.month) < nowKey) continue;
      const breakdown = calcNetSalary(
        Number(entry.grossAmount),
        params,
        entry.year,
      );
      await tx.incomeEntry.update({
        where: { id: entry.id },
        data: {
          amount: breakdown.net,
          taxBreakdown: breakdown as unknown as Prisma.InputJsonValue,
        },
      });
    }
  });
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
