"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn, formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";
import { IconButton } from "@/components/shared/icon-button";
import { BudgetImpactDetails } from "./budget-impact-details";
import { PlannedItemActionsMenu } from "./planned-item-actions-menu";
import { VerdictBadge } from "./verdict-badge";
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
  const schedule =
    item.type === PlannedItemTypes.OneTime
      ? start
      : item.type === PlannedItemTypes.Installments
        ? `${formatMoney(item.amount / (item.installments ?? 1))} × ${item.installments} · ${t.planning.from}${start}`
        : `${t.planning.from}${start}${
            item.endYear && item.endMonth
              ? ` ${t.planning.until} ${formatMonthKey(item.endYear, item.endMonth)}`
              : ""
          }`;

  const hasBudgetImpact = !!item.budgetImpact && item.budgetImpact.length > 0;

  function handleRowClick() {
    if (hasBudgetImpact) setExpanded((wasExpanded) => !wasExpanded);
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{item.title}</span>
            <Badge variant="info">{typeLabel}</Badge>
            {item.categoryName && (
              <Badge variant="default" className="hidden sm:inline-flex">
                {item.categoryName}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground tnum">
            {formatMoney(item.amount)}
            {item.type === PlannedItemTypes.Recurring &&
              ` / ${t.common.month}`}{" "}
            · {schedule}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <VerdictBadge verdict={item.verdict} />
          <span onClick={(event) => event.stopPropagation()}>
            <PlannedItemActionsMenu
              onEdit={onEdit}
              onDelete={onDelete}
              onSetStatus={onSetStatus}
            />
          </span>
          {hasBudgetImpact && (
            <IconButton label={t.planning.budgetImpact}>
              <ChevronDown
                className={cn("transition-transform", expanded && "rotate-180")}
              />
            </IconButton>
          )}
        </div>
      </div>
      {expanded && hasBudgetImpact && <BudgetImpactDetails item={item} />}
    </div>
  );
}
