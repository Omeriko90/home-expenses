"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export type Step = "upload" | "map" | "review";

export function StepIndicator({ step }: { step: Step }) {
  const { t } = useI18n();
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: t.import.selectFile },
    { key: "map", label: t.import.columnMapping },
    { key: "review", label: t.import.review },
  ];
  const activeIdx = steps.findIndex((s) => s.key === step);
  return (
    <span className="flex items-center gap-1.5">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <span
            className={cn(
              i === activeIdx
                ? "font-medium text-primary"
                : i < activeIdx
                  ? "text-foreground"
                  : "text-muted-foreground",
            )}
          >
            {i + 1}. {s.label}
          </span>
          {i < steps.length - 1 && <span className="text-muted-foreground">·</span>}
        </React.Fragment>
      ))}
    </span>
  );
}
