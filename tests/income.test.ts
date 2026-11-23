import { describe, it, expect } from "vitest";
import {
  resolveMonthIncome,
  type IncomeSourceData,
  type IncomeEntryData,
} from "@/lib/income-resolve";

let nextId = 0;
function entry(partial: Partial<IncomeEntryData>): IncomeEntryData {
  return {
    id: `e${nextId++}`,
    kind: "FIXED",
    name: null,
    year: 2026,
    month: 1,
    amount: 0,
    note: null,
    sourceId: null,
    ...partial,
  };
}

function source(partial: Partial<IncomeSourceData>): IncomeSourceData {
  return {
    id: `s${nextId++}`,
    name: "Salary",
    endYear: null,
    endMonth: null,
    ...partial,
  };
}

describe("resolveMonthIncome", () => {
  const salary = source({ id: "salary", name: "Salary" });

  it("applies a FIXED amount from its month onward", () => {
    const entries = [
      entry({ sourceId: "salary", kind: "FIXED", month: 1, amount: 12000 }),
    ];
    expect(resolveMonthIncome([salary], entries, 2026, 1).total).toBe(12000);
    expect(resolveMonthIncome([salary], entries, 2026, 8).total).toBe(12000);
    expect(resolveMonthIncome([salary], entries, 2027, 3).total).toBe(12000);
  });

  it("contributes nothing before the first FIXED month", () => {
    const entries = [
      entry({ sourceId: "salary", kind: "FIXED", month: 3, amount: 12000 }),
    ];
    const r = resolveMonthIncome([salary], entries, 2026, 2);
    expect(r.total).toBe(0);
    expect(r.sources).toHaveLength(0);
  });

  it("a raise applies from its month without rewriting history", () => {
    const entries = [
      entry({ sourceId: "salary", kind: "FIXED", month: 1, amount: 12000 }),
      entry({ sourceId: "salary", kind: "FIXED", month: 5, amount: 15000 }),
    ];
    expect(resolveMonthIncome([salary], entries, 2026, 4).total).toBe(12000);
    expect(resolveMonthIncome([salary], entries, 2026, 5).total).toBe(15000);
    expect(resolveMonthIncome([salary], entries, 2026, 12).total).toBe(15000);
  });

  it("an OVERRIDE replaces the fixed amount for exactly its month", () => {
    const entries = [
      entry({ sourceId: "salary", kind: "FIXED", month: 1, amount: 12000 }),
      entry({ sourceId: "salary", kind: "OVERRIDE", month: 3, amount: 12500 }),
    ];
    expect(resolveMonthIncome([salary], entries, 2026, 2).total).toBe(12000);
    const march = resolveMonthIncome([salary], entries, 2026, 3);
    expect(march.total).toBe(12500);
    expect(march.sources[0].isOverride).toBe(true);
    expect(resolveMonthIncome([salary], entries, 2026, 4).total).toBe(12000);
  });

  it("an OVERRIDE of 0 counts as 0, not as missing", () => {
    const entries = [
      entry({ sourceId: "salary", kind: "FIXED", month: 1, amount: 12000 }),
      entry({ sourceId: "salary", kind: "OVERRIDE", month: 3, amount: 0 }),
    ];
    const march = resolveMonthIncome([salary], entries, 2026, 3);
    expect(march.total).toBe(0);
    expect(march.sources).toHaveLength(1);
    expect(march.sources[0].isOverride).toBe(true);
  });

  it("an ended source stops counting after its end month, history kept", () => {
    const rental = source({
      id: "rental",
      name: "Rental",
      endYear: 2026,
      endMonth: 6,
    });
    const entries = [
      entry({ sourceId: "rental", kind: "FIXED", month: 1, amount: 3500 }),
    ];
    expect(resolveMonthIncome([rental], entries, 2026, 6).total).toBe(3500);
    expect(resolveMonthIncome([rental], entries, 2026, 7).total).toBe(0);
    expect(resolveMonthIncome([rental], entries, 2026, 3).total).toBe(3500);
  });

  it("a raise added before the end month cannot resurrect an ended source", () => {
    const rental = source({
      id: "rental",
      name: "Rental",
      endYear: 2026,
      endMonth: 6,
    });
    const entries = [
      entry({ sourceId: "rental", kind: "FIXED", month: 1, amount: 3500 }),
      entry({ sourceId: "rental", kind: "FIXED", month: 4, amount: 4000 }),
    ];
    expect(resolveMonthIncome([rental], entries, 2026, 5).total).toBe(4000);
    expect(resolveMonthIncome([rental], entries, 2026, 7).total).toBe(0);
    expect(resolveMonthIncome([rental], entries, 2027, 1).total).toBe(0);
  });

  it("a reactivated source (end cleared) counts again", () => {
    const rental = source({ id: "rental", name: "Rental" });
    const entries = [
      entry({ sourceId: "rental", kind: "FIXED", month: 1, amount: 3500 }),
    ];
    expect(resolveMonthIncome([rental], entries, 2027, 2).total).toBe(3500);
  });

  it("standalone ONE_TIME entries add for their month only", () => {
    const entries = [
      entry({ sourceId: "salary", kind: "FIXED", month: 1, amount: 12000 }),
      entry({ kind: "ONE_TIME", name: "Tax refund", month: 7, amount: 4300 }),
    ];
    const july = resolveMonthIncome([salary], entries, 2026, 7);
    expect(july.total).toBe(16300);
    expect(july.oneTimes).toHaveLength(1);
    expect(july.oneTimes[0].name).toBe("Tax refund");
    expect(resolveMonthIncome([salary], entries, 2026, 8).total).toBe(12000);
  });

  it("an override and a one-time can coexist in the same month", () => {
    const entries = [
      entry({ sourceId: "salary", kind: "FIXED", month: 1, amount: 12000 }),
      entry({ sourceId: "salary", kind: "OVERRIDE", month: 3, amount: 12500 }),
      entry({ kind: "ONE_TIME", name: "Bonus", month: 3, amount: 3000 }),
    ];
    expect(resolveMonthIncome([salary], entries, 2026, 3).total).toBe(15500);
  });

  it("multiple sources sum independently", () => {
    const partner = source({ id: "partner", name: "Partner salary" });
    const rental = source({ id: "rental", name: "Rental" });
    const entries = [
      entry({ sourceId: "salary", kind: "FIXED", month: 1, amount: 12000 }),
      entry({ sourceId: "partner", kind: "FIXED", month: 1, amount: 9000 }),
      entry({ sourceId: "rental", kind: "FIXED", month: 2, amount: 3500 }),
    ];
    expect(
      resolveMonthIncome([salary, partner, rental], entries, 2026, 1).total,
    ).toBe(21000);
    expect(
      resolveMonthIncome([salary, partner, rental], entries, 2026, 2).total,
    ).toBe(24500);
  });

  it("year boundaries resolve correctly (Dec fixed carries into Jan)", () => {
    const entries = [
      entry({ sourceId: "salary", kind: "FIXED", year: 2025, month: 12, amount: 12000 }),
      entry({ sourceId: "salary", kind: "FIXED", year: 2026, month: 2, amount: 15000 }),
    ];
    expect(resolveMonthIncome([salary], entries, 2026, 1).total).toBe(12000);
    expect(resolveMonthIncome([salary], entries, 2026, 2).total).toBe(15000);
  });

  it("an override without any FIXED yet does not count", () => {
    const entries = [
      entry({ sourceId: "salary", kind: "OVERRIDE", month: 3, amount: 500 }),
    ];
    expect(resolveMonthIncome([salary], entries, 2026, 3).total).toBe(0);
  });
});
