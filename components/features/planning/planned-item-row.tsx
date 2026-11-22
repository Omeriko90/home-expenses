"use client";

import * as React from "react";
import {
  Ban,
  Check,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn, formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";
import { DropdownMenu } from "@/components/ui/dropdown-menu/DropdownMenu";
import { IconButton } from "@/components/shared/icon-button";
import { BudgetImpactDetails } from "./budget-impact-details";
import { formatMonthKey, type ForecastItem } from "./types";

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
  onSetStatus: (status: "DONE" | "CANCELLED") => void;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = React.useState(false);

  const typeLabel = {
    ONE_TIME: t.planning.typeOneTime,
    RECURRING: t.planning.typeRecurring,
    INSTALLMENTS: t.planning.typeInstallments,
  }[item.type];

  const start = formatMonthKey(item.startYear, item.startMonth);
  const schedule =
    item.type === "ONE_TIME"
      ? start
      : item.type === "INSTALLMENTS"
        ? `${formatMoney(item.amount / (item.installments ?? 1))} × ${item.installments} · ${t.planning.from}${start}`
        : `${t.planning.from}${start}${
            item.endYear && item.endMonth
              ? ` ${t.planning.until} ${formatMonthKey(item.endYear, item.endMonth)}`
              : ""
          }`;

  const verdictBadge = {
    fits: (
      <Badge variant="success">{t.planning.verdictFits}</Badge>
    ),
    tight: (
      <Badge variant="warning">{t.planning.verdictTight}</Badge>
    ),
    over: (
      <Badge variant="danger">{t.planning.verdictOver}</Badge>
    ),
    unknown: (
      <Tooltip content={t.planning.verdictUnknownHint}>
        <Badge variant="default">{t.planning.verdictUnknown}</Badge>
      </Tooltip>
    ),
  }[item.verdict];

  const hasDetails = !!item.budgetImpact && item.budgetImpact.length > 0;

  return (
    <div className="group/row flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center gap-3">
        <Tooltip content={t.planning.include}>
          <Checkbox
            checked={included}
            onCheckedChange={(c) => onIncludedChange(c === true)}
            aria-label={t.planning.include}
          />
        </Tooltip>
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-0.5",
            !included && "opacity-50",
          )}
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
            {item.type === "RECURRING" && ` / ${t.common.month}`} · {schedule}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {verdictBadge}
          <DropdownMenu
            align="end"
            trigger={
              <IconButton label={t.common.more}>
                <MoreHorizontal />
              </IconButton>
            }
            items={[
              {
                label: t.common.edit,
                icon: <Pencil className="size-4" />,
                onSelect: onEdit,
              },
              {
                label: t.planning.markDone,
                icon: <Check className="size-4" />,
                onSelect: () => onSetStatus("DONE"),
              },
              {
                label: t.planning.markCancelled,
                icon: <Ban className="size-4" />,
                onSelect: () => onSetStatus("CANCELLED"),
              },
              { kind: "separator" },
              {
                label: t.common.delete,
                icon: <Trash2 className="size-4" />,
                variant: "danger",
                onSelect: onDelete,
              },
            ]}
          />
          {hasDetails && (
            <IconButton
              label={t.planning.budgetImpact}
              onClick={() => setExpanded((e) => !e)}
            >
              <ChevronDown
                className={cn("transition-transform", expanded && "rotate-180")}
              />
            </IconButton>
          )}
        </div>
      </div>
      {expanded && hasDetails && <BudgetImpactDetails item={item} />}
    </div>
  );
}
