"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { idSchema } from "@/lib/validate";
import {
  parseFile,
  type ColumnMapping,
  type Provider,
  type RawGrid,
} from "@/lib/importers";

export type ParseResult = {
  provider: Provider;
  headerRow: string[];
  grid: RawGrid;
  mapping: ColumnMapping;
  categories: { id: string; name: string; type: "EXPENSE" | "INVESTMENT" }[];
  mappings: { pattern: string; categoryId: string }[];
};

export async function parseImport(formData: FormData): Promise<ParseResult> {
  const { householdId } = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file");
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseFile(buffer, file.name);

  const [categories, mappings] = await Promise.all([
    prisma.category.findMany({
      where: { archived: false, householdId },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
    prisma.businessMapping.findMany({
      where: { householdId },
      select: { pattern: true, categoryId: true },
    }),
  ]);

  return {
    provider: parsed.provider,
    headerRow: parsed.headerRow,
    grid: parsed.grid,
    mapping: parsed.mapping,
    categories,
    mappings,
  };
}

const commitRowSchema = z.object({
  date: z.string().min(1), // ISO
  businessName: z.string().min(1).max(200),
  rawBusinessName: z.string().max(200),
  amount: z.number(),
  categoryId: idSchema,
  kind: z.enum(["FIXED", "VARIABLE"]),
  rawFileCategory: z.string().max(200).nullable(),
});

export type CommitRow = z.infer<typeof commitRowSchema>;

export async function commitImport(input: CommitRow[]) {
  const user = await requireUser();
  const rows = z.array(commitRowSchema).parse(input);
  if (rows.length === 0) return { created: 0 };

  await prisma.transaction.createMany({
    data: rows.map((r) => {
      const date = new Date(r.date);
      return {
        date,
        businessName: r.businessName,
        rawBusinessName: r.rawBusinessName,
        rawFileCategory: r.rawFileCategory,
        amount: r.amount,
        categoryId: r.categoryId,
        kind: r.kind,
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        createdByUserId: user.id,
        householdId: user.householdId,
      };
    }),
  });

  // Learn: upsert a mapping per distinct normalized business -> category.
  const byPattern = new Map<string, string>();
  for (const r of rows) {
    const key = r.businessName
      .replace(/["'״׳,]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    if (key) byPattern.set(key, r.categoryId);
  }
  for (const [pattern, categoryId] of byPattern) {
    await prisma.businessMapping.upsert({
      where: {
        householdId_pattern: { householdId: user.householdId, pattern },
      },
      update: { categoryId, hitCount: { increment: 1 } },
      create: { pattern, categoryId, householdId: user.householdId },
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { created: rows.length };
}
