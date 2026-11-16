/**
 * Preset holding types. The Hebrew `value` is canonical and is what gets
 * stored, regardless of UI language — so the same concept can't end up in
 * the data twice (once per language). `en` is display-only.
 */
export const INVESTMENT_TYPE_PRESETS: { value: string; en: string }[] = [
  { value: "קרן השתלמות", en: "Study fund" },
  { value: "קופת גמל", en: "Provident fund" },
  { value: "קופת גמל להשקעה", en: "Investment provident fund" },
  { value: "קרן פנסיה", en: "Pension fund" },
  { value: "ביטוח מנהלים", en: "Executive insurance" },
  { value: "ביטוח חיים", en: "Life insurance" },
  { value: "תיק מסחר עצמאי", en: "Brokerage account" },
  { value: "קרן כספית", en: "Money market fund" },
  { value: "פיקדון", en: "Bank deposit" },
  { value: "401k", en: "401k" },
];
