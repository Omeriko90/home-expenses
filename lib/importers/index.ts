import * as XLSX from "xlsx";

export type RawGrid = (string | number | null)[][];

export type ColumnMapping = {
  dateCol: number;
  businessCol: number;
  amountCol: number;
  categoryCol: number | null; // card-issuer category, optional
};

export type ParsedFile = {
  provider: Provider;
  grid: RawGrid; // data rows only (header stripped)
  headerRow: string[];
  mapping: ColumnMapping;
};

export type Provider = "MAX" | "ISRACARD" | "CAL" | "GENERIC";

export type ParsedRow = {
  rawDate: string | number | null;
  businessName: string;
  amount: number;
  fileCategory: string | null;
};

// Header keyword dictionaries (Hebrew) used to auto-map columns. These cover
// Max / Isracard / Cal exports, which share conventions, plus generic files.
const DATE_KEYS = ["תאריך עסקה", "תאריך רכישה", "תאריך", "מועד", "date"];
const BUSINESS_KEYS = [
  "שם בית העסק",
  "שם בית עסק",
  "בית עסק",
  "בית העסק",
  "תיאור",
  "פירוט",
  "merchant",
  "business",
  "description",
];
const AMOUNT_KEYS = [
  "סכום חיוב",
  "סכום החיוב",
  "סכום עסקה",
  "סכום",
  "חיוב",
  "amount",
  "sum",
  "charge",
];
const CATEGORY_KEYS = ["קטגוריה", "ענף", "תחום", "category", "sector"];

const PROVIDER_HINTS: { provider: Provider; keys: string[] }[] = [
  { provider: "MAX", keys: ["max", "לאומי קארד", "מקס"] },
  { provider: "ISRACARD", keys: ["isracard", "ישראכרט", "אמריקן", "amex"] },
  { provider: "CAL", keys: ["cal", "כאל", "ויזה כאל", "כ.א.ל"] },
];

function normalizeHeader(s: unknown): string {
  return String(s ?? "")
    .replace(/["'״׳]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function matchColumn(header: string[], keys: string[]): number {
  const norm = header.map(normalizeHeader);
  for (const key of keys) {
    const k = normalizeHeader(key);
    const idx = norm.findIndex((h) => h.includes(k));
    if (idx >= 0) return idx;
  }
  return -1;
}

/** Parse an uploaded xlsx/csv buffer into a grid of rows. */
export function readGrid(buffer: Buffer): RawGrid {
  const wb = XLSX.read(buffer, {
    type: "buffer",
    cellDates: false,
    raw: true,
    codepage: 65001, // UTF-8 for Hebrew CSVs
  });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<RawGrid[number]>(ws, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  }) as RawGrid;
}

/** Find the header row by scanning the first ~15 rows for date + amount headers. */
function findHeaderRow(grid: RawGrid): number {
  const limit = Math.min(grid.length, 15);
  for (let r = 0; r < limit; r++) {
    const row = (grid[r] ?? []).map(normalizeHeader);
    const hasDate = DATE_KEYS.some((k) =>
      row.some((h) => h.includes(normalizeHeader(k))),
    );
    const hasAmount = AMOUNT_KEYS.some((k) =>
      row.some((h) => h.includes(normalizeHeader(k))),
    );
    if (hasDate && hasAmount) return r;
  }
  return 0;
}

function detectProvider(grid: RawGrid, fileName: string): Provider {
  const blob = (
    fileName +
    " " +
    grid
      .slice(0, 6)
      .flat()
      .map((c) => String(c ?? ""))
      .join(" ")
  ).toLowerCase();
  for (const { provider, keys } of PROVIDER_HINTS) {
    if (keys.some((k) => blob.includes(k.toLowerCase()))) return provider;
  }
  return "GENERIC";
}

/** Auto-detect provider, header row and column mapping. */
export function parseFile(buffer: Buffer, fileName: string): ParsedFile {
  const full = readGrid(buffer);
  const headerIdx = findHeaderRow(full);
  const headerRow = (full[headerIdx] ?? []).map((c) => String(c ?? ""));
  const grid = full.slice(headerIdx + 1).filter((r) => r.some((c) => c !== null));

  const mapping: ColumnMapping = {
    dateCol: Math.max(0, matchColumn(headerRow, DATE_KEYS)),
    businessCol: Math.max(0, matchColumn(headerRow, BUSINESS_KEYS)),
    amountCol: Math.max(0, matchColumn(headerRow, AMOUNT_KEYS)),
    categoryCol: nullIfNeg(matchColumn(headerRow, CATEGORY_KEYS)),
  };

  return {
    provider: detectProvider(full, fileName),
    grid,
    headerRow,
    mapping,
  };
}

function nullIfNeg(n: number): number | null {
  return n < 0 ? null : n;
}

/** Apply a column mapping to the grid, producing normalized rows. */
export function extractRows(grid: RawGrid, mapping: ColumnMapping): ParsedRow[] {
  const rows: ParsedRow[] = [];
  for (const r of grid) {
    const business = String(r[mapping.businessCol] ?? "").trim();
    const amount = parseAmount(r[mapping.amountCol]);
    if (!business || amount === null) continue;
    rows.push({
      rawDate: r[mapping.dateCol] ?? null,
      businessName: business,
      amount,
      fileCategory:
        mapping.categoryCol !== null
          ? (String(r[mapping.categoryCol] ?? "").trim() || null)
          : null,
    });
  }
  return rows;
}

function parseAmount(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[₪,\s]/g, "").replace(/[^\d.-]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

/** Normalize a business name for mapping lookups (matches seed logic). */
export function normalizeBusiness(s: string): string {
  return s
    .replace(/["'״׳,]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Parse an Excel/serial/ISO/dd-mm-yyyy date into a JS Date (UTC). */
export function parseDate(
  raw: string | number | null,
  fallbackYear: number,
): Date {
  if (typeof raw === "number") {
    // Excel serial date.
    const d = XLSX.SSF?.parse_date_code?.(raw);
    if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d));
  }
  if (typeof raw === "string") {
    const m = raw.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
    if (m) {
      let [, dd, mm, yy] = m;
      const year = yy.length === 2 ? 2000 + Number(yy) : Number(yy);
      return new Date(Date.UTC(year, Number(mm) - 1, Number(dd)));
    }
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(Date.UTC(fallbackYear, 0, 1));
}
