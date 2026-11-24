"use client";

import { useI18n } from "@/lib/i18n/context";
import { dir } from "@/lib/i18n/dictionaries";

export function useChartDirection() {
  const { locale } = useI18n();
  const isRtl = dir(locale) === "rtl";
  return {
    isRtl,
    xAxisReversed: isRtl,
    yAxisOrientation: isRtl ? ("right" as const) : ("left" as const),
  };
}
