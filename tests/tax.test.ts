import { describe, expect, it } from "vitest";
import { calcBonusNet, calcNetSalary } from "@/lib/tax/calc";
import { getTaxConstants, latestTaxYear } from "@/lib/tax/constants";
import type { TaxParams } from "@/lib/tax/types";

const standard: TaxParams = {
  creditPoints: 2.25,
  pensionRate: 0.06,
  hishtalmutRate: null,
};
const noDeductions: TaxParams = {
  creditPoints: 2.25,
  pensionRate: null,
  hishtalmutRate: null,
};

describe("calcNetSalary 2026 fixtures", () => {
  it("gross 10,000 with 2.25 points and 6% pension", () => {
    const result = calcNetSalary(10000, standard, 2026);
    expect(result.incomeTax).toBe(365.1);
    expect(result.bituachLeumi).toBe(240.9);
    expect(result.healthTax).toBe(367.56);
    expect(result.pension).toBe(600);
    expect(result.net).toBe(8426.44);
  });

  it("gross 20,000 with 2.25 points and 6% pension", () => {
    const result = calcNetSalary(20000, standard, 2026);
    expect(result.incomeTax).toBe(2757.35);
    expect(result.bituachLeumi).toBe(940.9);
    expect(result.healthTax).toBe(884.56);
    expect(result.pension).toBe(1200);
    expect(result.pensionCredit).toBe(237.65);
    expect(result.net).toBe(14217.19);
  });

  it("gross 50,000 with 2.25 points and 6% pension", () => {
    const result = calcNetSalary(50000, standard, 2026);
    expect(result.incomeTax).toBe(13556.95);
    expect(result.surtax).toBe(0);
    expect(result.bituachLeumi).toBe(3040.9);
    expect(result.healthTax).toBe(2435.56);
    expect(result.net).toBe(27966.59);
  });

  it("applies hishtalmut when enabled", () => {
    const result = calcNetSalary(20000, { ...standard, hishtalmutRate: 0.025 }, 2026);
    expect(result.hishtalmut).toBe(500);
    expect(result.net).toBe(14217.19 - 500);
  });
});

describe("calcNetSalary mechanics", () => {
  it("floors income tax at zero on low gross", () => {
    const result = calcNetSalary(5000, noDeductions, 2026);
    expect(result.incomeTax).toBe(0);
    expect(result.creditValue).toBe(500);
    expect(result.creditValue).toBeLessThan(2.25 * 242);
  });

  it("taxes the first bracket boundary exactly", () => {
    const atBoundary = calcNetSalary(7010, { ...noDeductions, creditPoints: 0 }, 2026);
    expect(atBoundary.incomeTax).toBe(701);
    const aboveBoundary = calcNetSalary(7011, { ...noDeductions, creditPoints: 0 }, 2026);
    expect(aboveBoundary.incomeTax).toBe(701.14);
  });

  it("caps national insurance at the ceiling", () => {
    const atCap = calcNetSalary(51910, noDeductions, 2026);
    const aboveCap = calcNetSalary(80000, noDeductions, 2026);
    expect(aboveCap.bituachLeumi).toBe(atCap.bituachLeumi);
    expect(aboveCap.healthTax).toBe(atCap.healthTax);
  });

  it("switches national insurance rate at the reduced ceiling", () => {
    const reduced = calcNetSalary(7703, noDeductions, 2026);
    expect(reduced.bituachLeumi).toBe(80.11);
    expect(reduced.healthTax).toBe(248.81);
  });

  it("charges surtax only on the excess above the threshold", () => {
    const below = calcNetSalary(60130, noDeductions, 2026);
    expect(below.surtax).toBe(0);
    const above = calcNetSalary(70130, noDeductions, 2026);
    expect(above.surtax).toBe(300);
  });

  it("caps the pension credit at the eligible contribution", () => {
    const result = calcNetSalary(20000, standard, 2026);
    expect(result.pensionCredit).toBe(roundTwo(0.07 * 9700 * 0.35));
  });

  it("breakdown components always sum exactly to gross minus net", () => {
    const grosses = [3123.45, 6000, 7703, 9999.99, 12345.67, 23456, 48000, 52000, 61000, 75500.5];
    for (const gross of grosses) {
      const result = calcNetSalary(gross, { ...standard, hishtalmutRate: 0.025 }, 2026);
      const deductions =
        result.incomeTax +
        result.surtax +
        result.bituachLeumi +
        result.healthTax +
        result.pension +
        result.hishtalmut;
      expect(roundTwo(result.net + deductions)).toBe(gross);
    }
  });

  it("falls back to the latest constants for unknown years", () => {
    const future = calcNetSalary(20000, standard, 2030);
    expect(future.taxYear).toBe(latestTaxYear());
    const past = calcNetSalary(20000, standard, 2020);
    expect(past.taxYear).toBe(2026);
    expect(getTaxConstants(2030).year).toBe(latestTaxYear());
  });
});

describe("calcBonusNet", () => {
  it("taxes a bonus at the marginal rate, above the average rate", () => {
    const base = calcNetSalary(20000, noDeductions, 2026);
    const bonus = calcBonusNet(20000, 5000, standard, 2026);
    const averageNetRatio = base.net / base.gross;
    expect(bonus.net).toBeLessThan(5000 * averageNetRatio);
    expect(bonus.pension).toBe(0);
    expect(bonus.hishtalmut).toBe(0);
    expect(bonus.pensionCredit).toBe(0);
  });

  it("equals a standalone calculation when there is no base", () => {
    const standalone = calcNetSalary(5000, noDeductions, 2026);
    const bonus = calcBonusNet(0, 5000, noDeductions, 2026);
    expect(bonus.net).toBe(standalone.net);
    expect(bonus.incomeTax).toBe(standalone.incomeTax);
  });

  it("bonus components sum exactly to bonus gross minus net", () => {
    const bonus = calcBonusNet(25000, 7777.77, standard, 2026);
    const deductions =
      bonus.incomeTax + bonus.surtax + bonus.bituachLeumi + bonus.healthTax;
    expect(roundTwo(bonus.net + deductions)).toBe(7777.77);
  });
});

function roundTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
