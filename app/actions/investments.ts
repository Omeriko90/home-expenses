"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

const holdingSchema = z.object({
  portfolioId: z.string().min(1),
  holdingId: z.string().optional().nullable(),
  channel: z.string().max(80),
  instrument: z.string().min(1).max(120),
  house: z.string().max(120),
  year: z.number().int(),
  value: z.number().min(0),
});

export async function upsertHolding(input: z.infer<typeof holdingSchema>) {
  await requireUser();
  const d = holdingSchema.parse(input);
  let holdingId = d.holdingId ?? null;
  if (holdingId) {
    await prisma.holding.update({
      where: { id: holdingId },
      data: { channel: d.channel, instrument: d.instrument, house: d.house },
    });
  } else {
    const h = await prisma.holding.create({
      data: {
        portfolioId: d.portfolioId,
        channel: d.channel,
        instrument: d.instrument,
        house: d.house,
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
  await requireUser();
  await prisma.holding.delete({ where: { id: holdingId } });
  revalidatePath("/investments");
  return { ok: true as const };
}

export async function upsertDeposits(
  portfolioId: string,
  year: number,
  deposits: number,
) {
  await requireUser();
  await prisma.portfolioYear.upsert({
    where: { portfolioId_year: { portfolioId, year } },
    update: { deposits },
    create: { portfolioId, year, deposits },
  });
  revalidatePath("/investments");
  return { ok: true as const };
}

export async function createPortfolio(name: string, group: "MAIN" | "KIDS") {
  await requireUser();
  await prisma.portfolio.create({ data: { name, group } });
  revalidatePath("/investments");
  return { ok: true as const };
}
