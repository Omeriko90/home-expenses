"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function PlanNextYearBanner({
  planningYear,
  text,
}: {
  planningYear: number;
  text: string;
}) {
  return (
    <Link
      href={`?year=${planningYear}`}
      className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
    >
      <Sparkles className="size-4 shrink-0" />
      <span className="tnum">{text}</span>
    </Link>
  );
}
