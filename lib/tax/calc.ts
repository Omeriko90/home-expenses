import { getTaxConstants } from "./constants";
import type { TaxBracket, TaxBreakdown, TaxParams } from "./types";

function roundAgorot(value: number): number {
  return Math.round(value * 100) / 100;
}

function bracketTax(gross: number, brackets: TaxBracket[]): number {
  let tax = 0;
  let previousCap = 0;
  for (const bracket of brackets) {
    if (gross <= previousCap) break;
    const cap = bracket.upTo ?? Number.POSITIVE_INFINITY;
    tax += (Math.min(gross, cap) - previousCap) * bracket.rate;
    previousCap = cap;
  }
  return tax;
}

export function calcNetSalary(
  gross: number,
  params: TaxParams,
  year: number,
): TaxBreakdown {
  const constants = getTaxConstants(year);
  const creditPoints = params.creditPoints ?? 0;

  if (gross <= 0) {
    return {
      gross,
      net: gross,
      incomeTax: 0,
      surtax: 0,
      bituachLeumi: 0,
      healthTax: 0,
      pension: 0,
      hishtalmut: 0,
      creditPoints,
      creditValue: 0,
      pensionCredit: 0,
      taxYear: constants.year,
    };
  }

  const pension = roundAgorot(gross * (params.pensionRate ?? 0));
  const hishtalmutBase =
    (params.hishtalmutCapped ?? true)
      ? Math.min(gross, constants.hishtalmutCeiling)
      : gross;
  const hishtalmut = roundAgorot(hishtalmutBase * (params.hishtalmutRate ?? 0));

  const rawTax = bracketTax(gross, constants.brackets);
  const creditValue = roundAgorot(
    Math.min(rawTax, creditPoints * constants.creditPointValue),
  );
  const afterPointsCredit = rawTax - creditValue;

  const eligibleContribution = Math.min(
    pension,
    constants.pension.eligibleRate *
      Math.min(gross, constants.pension.eligibleIncomeCeiling),
  );
  const pensionCredit = roundAgorot(
    Math.min(
      afterPointsCredit,
      eligibleContribution * constants.pension.creditRate,
    ),
  );
  const incomeTax = roundAgorot(afterPointsCredit - pensionCredit);

  const surtax = roundAgorot(
    Math.max(0, gross - constants.surtax.monthlyThreshold) *
      constants.surtax.rate,
  );

  const ni = constants.nationalInsurance;
  const reducedBase = Math.min(gross, ni.reducedCeiling);
  const fullBase = Math.max(0, Math.min(gross, ni.cap) - ni.reducedCeiling);
  const bituachLeumi = roundAgorot(
    reducedBase * ni.biReduced + fullBase * ni.biFull,
  );
  const healthTax = roundAgorot(
    reducedBase * ni.healthReduced + fullBase * ni.healthFull,
  );

  const net = roundAgorot(
    gross - incomeTax - surtax - bituachLeumi - healthTax - pension - hishtalmut,
  );

  return {
    gross,
    net,
    incomeTax,
    surtax,
    bituachLeumi,
    healthTax,
    pension,
    hishtalmut,
    creditPoints,
    creditValue,
    pensionCredit,
    taxYear: constants.year,
  };
}

export function calcBonusNet(
  baseGross: number,
  bonusGross: number,
  params: TaxParams,
  year: number,
): TaxBreakdown {
  const strippedParams: TaxParams = {
    ...params,
    pensionRate: null,
    hishtalmutRate: null,
  };
  const withBonus = calcNetSalary(baseGross + bonusGross, strippedParams, year);
  const baseOnly = calcNetSalary(baseGross, strippedParams, year);

  const incomeTax = roundAgorot(withBonus.incomeTax - baseOnly.incomeTax);
  const surtax = roundAgorot(withBonus.surtax - baseOnly.surtax);
  const bituachLeumi = roundAgorot(
    withBonus.bituachLeumi - baseOnly.bituachLeumi,
  );
  const healthTax = roundAgorot(withBonus.healthTax - baseOnly.healthTax);
  const net = roundAgorot(
    bonusGross - incomeTax - surtax - bituachLeumi - healthTax,
  );

  return {
    gross: bonusGross,
    net,
    incomeTax,
    surtax,
    bituachLeumi,
    healthTax,
    pension: 0,
    hishtalmut: 0,
    creditPoints: params.creditPoints,
    creditValue: roundAgorot(withBonus.creditValue - baseOnly.creditValue),
    pensionCredit: 0,
    taxYear: withBonus.taxYear,
  };
}
