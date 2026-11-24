"use client";

import { useState } from "react";
import { ChevronDown, TriangleAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn, formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";
import { IconButton } from "@/components/shared/icon-button";
import { BudgetImpactDetails } from "./budget-impact-details";
import { PlannedItemActionsMenu } from "./planned-item-actions-menu";
import {
  formatMonthKey,
  PlannedItemTypes,
  type ForecastItem,
  type PlannedItemStatus,
} from "./types";

export function PlannedItemRow({
  item,
  included,
  onIncludedChange,
  onEdit,
  onDelete,
  onSetStatus,
}: {
  item: ForecastItem;
  included: boolean;
  onIncludedChange: (included: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetStatus: (status: PlannedItemStatus) => void;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const typeLabel = {
    [PlannedItemTypes.OneTime]: t.planning.typeOneTime,
    [PlannedItemTypes.Recurring]: t.planning.typeRecurring,
    [PlannedItemTypes.Installments]: t.planning.typeInstallments,
  }[item.type];

  const start = formatMonthKey(item.startYear, item.startMonth);
  const scheduleParts =
    item.type === PlannedItemTypes.OneTime
      ? [start]
      : item.type === PlannedItemTypes.Installments
        ? [
            `${formatMoney(item.amount / (item.installments ?? 1))} × ${item.installments}`,
            `${t.planning.from}${start}`,
          ]
        : [
            `${t.planning.from}${start}`,
            ...(item.endYear && item.endMonth
              ? [`${t.planning.until} ${formatMonthKey(item.endYear, item.endMonth)}`]
              : []),
          ];
  const metaParts = [
    `${formatMoney(item.amount)}${
      item.type === PlannedItemTypes.Recurring ? ` / ${t.common.month}` : ""
    }`,
    ...scheduleParts,
  ];

  const hasBudgetImpact = !!item.budgetImpact && item.budgetImpact.length > 0;

  function handleRowClick() {
    if (hasBudgetImpact) setExpanded((wasExpanded) => !wasExpanded);
  }

  return (
    <div className="flex flex-col px-4 py-3">
      <div
        className={cn("flex items-center gap-3", {
          "cursor-pointer": hasBudgetImpact,
        })}
        onClick={handleRowClick}
      >
        <span onClick={(event) => event.stopPropagation()}>
          <Tooltip content={t.planning.include}>
            <Checkbox
              checked={included}
              onCheckedChange={(checked) => onIncludedChange(checked === true)}
              aria-label={t.planning.include}
            />
          </Tooltip>
        </span>
        <div
          className={cn("flex min-w-0 flex-1 flex-col gap-0.5", {
            "opacity-50": !included,
          })}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{item.title}</span>
            {item.verdict === "over" && (
              <TriangleAlert className="size-4 shrink-0 text-danger" />
            )}
            <span className="hidden shrink-0 items-center gap-2 sm:flex">
              <Badge variant="info">{typeLabel}</Badge>
              {item.categoryName && (
                <Badge variant="default">{item.categoryName}</Badge>
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
            <Badge variant="info">{typeLabel}</Badge>
            {item.categoryName && (
              <Badge variant="default">{item.categoryName}</Badge>
            )}
          </div>
          <span className="flex flex-wrap gap-x-1 text-xs text-muted-foreground tnum">
            {metaParts.map((part, index) => (
              <span key={index} className="whitespace-nowrap">
                {index > 0 && "· "}
                {part}
              </span>
            ))}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span onClick={(event) => event.stopPropagation()}>
            <PlannedItemActionsMenu
              onEdit={onEdit}
              onDelete={onDelete}
              onSetStatus={onSetStatus}
            />
          </span>
          {hasBudgetImpact ? (
            <IconButton label={t.planning.budgetImpact}>
              <ChevronDown
                className={cn("transition-transform", expanded && "rotate-180")}
              />
            </IconButton>
          ) : (
            <span aria-hidden className="size-10 shrink-0" />
          )}
        </div>
      </div>
      {hasBudgetImpact && (
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-in-out",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="pt-2">
              <BudgetImpactDetails item={item} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
