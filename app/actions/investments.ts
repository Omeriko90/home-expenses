"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { idSchema, yearSchema } from "@/lib/validate";

const holdingSchema = z.object({
  portfolioId: z.string().min(1),
  holdingId: z.string().optional().nullable(),
  channel: z.string().max(80),
  instrument: z.string().min(1).max(120),
  house: z.string().max(120),
  type: z.string().max(120),
  year: z.number().int(),
  value: z.number().min(0),
});

export async function upsertHolding(input: z.infer<typeof holdingSchema>) {
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

export async function upsertDeposits(
  portfolioId: string,
  year: number,
  deposits: number,
) {
  const { householdId } = await requireUser();
  idSchema.parse(portfolioId);
  yearSchema.parse(year);
  z.number().min(0).parse(deposits);
  const portfolio = await prisma.portfolio.findFirst({
    where: { id: portfolioId, householdId },
    select: { id: true },
  });
  if (!portfolio) return { error: "notFound" as const };
  await prisma.portfolioYear.upsert({
    where: { portfolioId_year: { portfolioId, year } },
    update: { deposits },
    create: { portfolioId, year, deposits },
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
