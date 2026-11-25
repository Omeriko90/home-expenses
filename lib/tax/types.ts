export type TaxParams = {
  creditPoints: number;
  pensionRate: number | null;
  hishtalmutRate: number | null;
};

export type TaxBreakdown = {
  gross: number;
  net: number;
  incomeTax: number;
  surtax: number;
  bituachLeumi: number;
  healthTax: number;
  pension: number;
  hishtalmut: number;
  creditPoints: number;
  creditValue: number;
  pensionCredit: number;
  taxYear: number;
};

export type TaxBracket = {
  upTo: number | null;
  rate: number;
};

export type TaxYearConstants = {
  year: number;
  brackets: TaxBracket[];
  surtax: { monthlyThreshold: number; rate: number };
  creditPointValue: number;
  nationalInsurance: {
    reducedCeiling: number;
    cap: number;
    biReduced: number;
    biFull: number;
    healthReduced: number;
    healthFull: number;
  };
  pension: {
    creditRate: number;
    eligibleRate: number;
    eligibleIncomeCeiling: number;
  };
};
