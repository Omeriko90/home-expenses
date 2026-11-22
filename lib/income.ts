/**
 * Expected household income for a given month. The app has no income model
 * yet; this is the single seam a future feature implements. Until then every
 * month's expected income is 0, and consumers (forecast, planning UI) must
 * treat a 0-income series as "income not set up" rather than a real deficit.
 */
export async function getExpectedMonthlyIncome(
  householdId: string,
  year: number,
  month: number,
): Promise<number> {
  void householdId;
  void year;
  void month;
  return 0;
}
