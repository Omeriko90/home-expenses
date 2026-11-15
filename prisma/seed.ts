/**
 * Migrate the legacy Excel workbook into the database.
 * Idempotent: safe to re-run (upserts on natural keys).
 *
 *   npx tsx prisma/seed.ts [path-to-xlsx]
 */
import * as path from "node:path";
import * as XLSX from "xlsx";
import { PrismaClient, CategoryType, TxKind } from "@prisma/client";

const prisma = new PrismaClient();
const FILE = process.argv[2] ?? "expenses_and_investments.xlsx";

const YEAR_SHEETS = ["2022", "2023", "2024", "2025", "2026"];
const MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];
const FIXED_MARKER = "הוצאות קבועות";
const VARIABLE_MARKER = "הוצאות משתנות";

// Categories that are really investment deposits (portfolio/savings buckets).
const INVESTMENT_CATEGORIES = new Set(
  [
    "תיק ילדים", "קרן חירום", "תיק אישי ישראלי", "תיק אישי אמריקאי",
    "תיק שלנו", "העברה לתיק", "חיסכון בר מצווה לארבל", "בר מצווה ארבל",
  ].map(normalize),
);

// Explicit cross-year variant -> canonical official name.
const ALIASES: Record<string, string> = {
  "כבישי אגרה": "כבישי אגרה + חניונים",
  ציוד: "ציוד ילדים",
  "התארגנויות + ציוד": "ציוד ילדים",
};

function normalize(s: string): string {
  return s
    .replace(/["'״׳,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type Grid = (string | number | boolean | null)[][];

function readSheet(wb: XLSX.WorkBook, name: string): Grid {
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`Missing sheet: ${name}`);
  return XLSX.utils.sheet_to_json<Grid[number]>(ws, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
  }) as Grid;
}

const num = (v: unknown): number | null =>
  typeof v === "number" && !Number.isNaN(v) ? v : null;
const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

// ------------------------------------------------------------------ //
// Category resolution — builds a normalized-name -> Category.id cache //
// ------------------------------------------------------------------ //
const catCache = new Map<string, string>(); // normalized name -> id

async function ensureCategory(
  rawName: string,
  opts: { type?: CategoryType; description?: string } = {},
): Promise<string> {
  const aliased = ALIASES[rawName.trim()] ?? rawName.trim();
  const key = normalize(aliased);
  const cached = catCache.get(key);
  if (cached) return cached;

  const type =
    opts.type ??
    (INVESTMENT_CATEGORIES.has(key)
      ? CategoryType.INVESTMENT
      : CategoryType.EXPENSE);

  // Try to find an existing category whose normalized name matches.
  const existing = await prisma.category.findFirst({ where: { name: aliased } });
  const cat =
    existing ??
    (await prisma.category.create({
      data: { name: aliased, type, description: opts.description ?? null },
    }));

  catCache.set(key, cat.id);
  return cat.id;
}

// ------------------------------------------------------------------ //
async function seedCategories(wb: XLSX.WorkBook) {
  const grid = readSheet(wb, "קטגוריות");
  let count = 0;
  for (let r = 1; r < grid.length; r++) {
    const name = str(grid[r]?.[0]);
    if (!name) continue;
    const desc = str(grid[r]?.[1]) ?? undefined;
    await ensureCategory(name, {
      type: INVESTMENT_CATEGORIES.has(normalize(name))
        ? CategoryType.INVESTMENT
        : CategoryType.EXPENSE,
      description: desc,
    });
    count++;
  }
  console.log(`  categories (official): ${count}`);
}

// ------------------------------------------------------------------ //
async function seedBudgets(wb: XLSX.WorkBook) {
  const grid = readSheet(wb, "תקציב שנתי");
  // Row 0: year headers; row 1: חודשי/שנתי. Monthly columns per year:
  //   2025 -> col2, 2024 -> col4, 2023 -> col6, 2026 -> col8 (0-indexed)
  const yearMonthlyCol: Record<number, number> = {
    2025: 2,
    2024: 4,
    2023: 6,
    2026: 8,
  };
  let count = 0;
  for (let r = 2; r < grid.length; r++) {
    const name = str(grid[r]?.[0]);
    if (!name) continue;
    const catId = await ensureCategory(name);
    for (const [yearStr, col] of Object.entries(yearMonthlyCol)) {
      const monthly = num(grid[r]?.[col]);
      if (monthly === null) continue;
      const year = Number(yearStr);
      await prisma.budget.upsert({
        where: { categoryId_year: { categoryId: catId, year } },
        update: { monthlyAmount: monthly },
        create: { categoryId: catId, year, monthlyAmount: monthly },
      });
      count++;
    }
  }
  console.log(`  budgets: ${count}`);
}

// ------------------------------------------------------------------ //
async function seedTransactions(wb: XLSX.WorkBook) {
  let total = 0;
  const unmatched = new Set<string>();

  for (const sheet of YEAR_SHEETS) {
    const grid = readSheet(wb, sheet);
    const year = Number(sheet);
    let month = 0; // 1-12, 0 = before first month block
    let kind: TxKind = TxKind.VARIABLE;
    const rows: {
      businessName: string;
      amount: number;
      categoryId: string;
      kind: TxKind;
      month: number;
    }[] = [];

    for (let r = 0; r < grid.length; r++) {
      const c1 = str(grid[r]?.[0]);
      const c2 = grid[r]?.[1];
      const c3 = str(grid[r]?.[2]);

      if (c1 && MONTHS.includes(c1)) {
        month = MONTHS.indexOf(c1) + 1;
        kind = TxKind.VARIABLE;
        continue;
      }
      if (c1 === FIXED_MARKER) {
        kind = TxKind.FIXED;
        continue;
      }
      if (c1 === VARIABLE_MARKER) {
        kind = TxKind.VARIABLE;
        continue;
      }

      // Transaction row: business (c1), numeric amount (c2), category (c3).
      const amount = num(c2);
      if (month === 0 || amount === null || !c1 || !c3) continue;

      const catId = await ensureCategory(c3);
      if (!catCache.has(normalize(ALIASES[c3] ?? c3))) unmatched.add(c3);
      rows.push({
        businessName: c1,
        amount,
        categoryId: catId,
        kind,
        month,
      });
    }

    // Replace this year's transactions for idempotency, then bulk-insert.
    await prisma.transaction.deleteMany({ where: { year } });
    if (rows.length) {
      await prisma.transaction.createMany({
        data: rows.map((row) => ({
          ...row,
          year,
          date: new Date(Date.UTC(year, row.month - 1, 1)),
        })),
      });
    }
    total += rows.length;
    console.log(`  ${sheet}: ${rows.length} transactions`);
  }

  console.log(`  transactions total: ${total}`);
  if (unmatched.size) {
    console.log(
      `  note: newly created (non-official) categories: ${[...unmatched].join(", ")}`,
    );
  }
}

// ------------------------------------------------------------------ //
async function seedBusinessMappings() {
  // Seed the import learner from history: most-frequent category per business.
  const txs = await prisma.transaction.findMany({
    select: { businessName: true, categoryId: true },
  });
  const tally = new Map<string, Map<string, number>>();
  for (const t of txs) {
    const key = normalize(t.businessName);
    if (!key) continue;
    const inner = tally.get(key) ?? new Map();
    inner.set(t.categoryId, (inner.get(t.categoryId) ?? 0) + 1);
    tally.set(key, inner);
  }
  let count = 0;
  for (const [pattern, inner] of tally) {
    let best = "";
    let bestN = 0;
    for (const [catId, n] of inner) if (n > bestN) ((best = catId), (bestN = n));
    await prisma.businessMapping.upsert({
      where: { pattern },
      update: { categoryId: best, hitCount: bestN },
      create: { pattern, categoryId: best, hitCount: bestN },
    });
    count++;
  }
  console.log(`  business mappings: ${count}`);
}

// ------------------------------------------------------------------ //
async function seedGoals(wb: XLSX.WorkBook) {
  const sheets = ["השקעות שנתי", "השקעות ילדים שנתי"];
  let count = 0;
  for (const sheet of sheets) {
    if (!wb.Sheets[sheet]) continue;
    const grid = readSheet(wb, sheet);
    for (let r = 0; r < grid.length; r++) {
      const c1 = str(grid[r]?.[0]);
      if (!c1 || !c1.startsWith("יעדים ל")) continue;
      const year = Number(c1.replace(/\D/g, "")) || 0;
      if (!year) continue;

      // Following rows: c1 = boolean done, c2 = description, c6 expected, c7 actual.
      for (let rr = r + 2; rr < grid.length; rr++) {
        const done = grid[rr]?.[0];
        const desc = str(grid[rr]?.[1]);
        if (typeof done !== "boolean" || !desc) break;
        const expected = num(grid[rr]?.[5]);
        const actual = num(grid[rr]?.[6]);

        // Dedup by (title, year).
        const existing = await prisma.goal.findFirst({
          where: { title: desc, year },
        });
        if (existing) continue;

        if (expected !== null) {
          await prisma.goal.create({
            data: {
              title: desc,
              year,
              type: "NUMERIC",
              targetAmount: expected,
              currentAmount: actual ?? 0,
            },
          });
        } else {
          await prisma.goal.create({
            data: {
              title: desc,
              year,
              type: "CHECKLIST",
              milestones: { create: [{ title: desc, done }] },
            },
          });
        }
        count++;
      }
    }
  }
  console.log(`  goals: ${count}`);
}

// ------------------------------------------------------------------ //
async function seedInvestments(wb: XLSX.WorkBook) {
  const sources = [
    { sheet: "השקעות שנתי", group: "MAIN" as const, name: "תיק ההשקעות" },
    { sheet: "השקעות ילדים שנתי", group: "KIDS" as const, name: "תיק ילדים" },
  ];
  let holdingCount = 0;
  let yearCount = 0;

  for (const src of sources) {
    if (!wb.Sheets[src.sheet]) continue;
    const grid = readSheet(wb, src.sheet);

    const portfolio =
      (await prisma.portfolio.findFirst({
        where: { name: src.name, group: src.group },
      })) ??
      (await prisma.portfolio.create({
        data: { name: src.name, group: src.group },
      }));

    // Locate header rows: c0 === "תיק" and c3 === "אפיק".
    const headers: number[] = [];
    for (let r = 0; r < grid.length; r++) {
      if (str(grid[r]?.[0]) === "תיק" && str(grid[r]?.[3]) === "אפיק") {
        headers.push(r);
      }
    }

    for (let h = 0; h < headers.length; h++) {
      const hr = headers[h];
      const blockEnd = h + 1 < headers.length ? headers[h + 1] : grid.length;

      // Year = nearest year marker above the header.
      let year = 0;
      for (let r = hr; r >= 0; r--) {
        const v = grid[r]?.[0];
        if (typeof v === "number" && v >= 2019 && v <= 2035) {
          year = v;
          break;
        }
      }
      if (!year) continue;

      // Deposits: prefer the "סה״כ" row; else sum named buckets.
      let depositsTotal = 0;
      let sawTotal = false;
      let bucketSum = 0;
      let channel = "";
      for (let r = hr + 1; r < blockEnd; r++) {
        const c1 = str(grid[r]?.[0]);
        const d = num(grid[r]?.[1]);
        if (c1 === "סה״כ" && d !== null) {
          depositsTotal = d;
          sawTotal = true;
        } else if (c1 && d !== null && c1 !== "תיק") {
          bucketSum += d;
        }

        // Holdings: channel (c4) carries forward; instrument (c5), value (c7).
        const ch = str(grid[r]?.[3]);
        if (ch) channel = ch;
        const instrument = str(grid[r]?.[4]);
        const house = str(grid[r]?.[5]);
        const value = num(grid[r]?.[6]);
        if (instrument && value !== null) {
          const holding =
            (await prisma.holding.findFirst({
              where: {
                portfolioId: portfolio.id,
                instrument,
                house: house ?? "",
                channel: channel || "",
              },
            })) ??
            (await prisma.holding.create({
              data: {
                portfolioId: portfolio.id,
                channel: channel || "",
                instrument,
                house: house ?? "",
              },
            }));
          await prisma.holdingSnapshot.upsert({
            where: { holdingId_year: { holdingId: holding.id, year } },
            update: { value },
            create: { holdingId: holding.id, year, value },
          });
          holdingCount++;
        }
      }
      if (!sawTotal) depositsTotal = bucketSum;

      await prisma.portfolioYear.upsert({
        where: { portfolioId_year: { portfolioId: portfolio.id, year } },
        update: { deposits: depositsTotal },
        create: { portfolioId: portfolio.id, year, deposits: depositsTotal },
      });
      yearCount++;
    }
  }
  console.log(`  investments: ${yearCount} portfolio-years, ${holdingCount} snapshots`);
}

// ------------------------------------------------------------------ //
async function main() {
  const abs = path.resolve(FILE);
  console.log(`Reading ${abs}`);
  const wb = XLSX.readFile(abs);

  console.log("Seeding categories…");
  await seedCategories(wb);
  console.log("Seeding budgets…");
  await seedBudgets(wb);
  console.log("Seeding transactions…");
  await seedTransactions(wb);
  console.log("Seeding business mappings…");
  await seedBusinessMappings();
  console.log("Seeding investments…");
  await seedInvestments(wb);
  console.log("Seeding goals…");
  await seedGoals(wb);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
