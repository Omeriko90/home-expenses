import type { TaxYearConstants } from "./types";

export const TAX_YEARS: Record<number, TaxYearConstants> = {
  2026: {
    year: 2026,
    brackets: [
      { upTo: 7010, rate: 0.1 },
      { upTo: 10060, rate: 0.14 },
      { upTo: 16150, rate: 0.2 },
      { upTo: 22440, rate: 0.31 },
      { upTo: 46690, rate: 0.35 },
      { upTo: null, rate: 0.47 },
    ],
    surtax: { monthlyThreshold: 60130, rate: 0.03 },
    creditPointValue: 242,
    nationalInsurance: {
      reducedCeiling: 7703,
      cap: 51910,
      biReduced: 0.0104,
      biFull: 0.07,
      healthReduced: 0.0323,
      healthFull: 0.0517,
    },
    pension: {
      creditRate: 0.35,
      eligibleRate: 0.07,
      eligibleIncomeCeiling: 9700,
    },
    hishtalmutCeiling: 15712,
  },
};

export function latestTaxYear(): number {
  return Math.max(...Object.keys(TAX_YEARS).map(Number));
}

export function getTaxConstants(year: number): TaxYearConstants {
  if (TAX_YEARS[year]) return TAX_YEARS[year];
  const years = Object.keys(TAX_YEARS)
    .map(Number)
    .sort((a, b) => a - b);
  const fallback = [...years].reverse().find((y) => y <= year) ?? years[0];
  return TAX_YEARS[fallback];
}
