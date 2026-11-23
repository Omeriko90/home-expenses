"use client";

import { Ban, Check, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { IconButton } from "@/components/shared/icon-button";
import { DropdownMenu } from "@/components/ui/dropdown-menu/DropdownMenu";
import { PlannedItemStatuses, type PlannedItemStatus } from "./types";

export function PlannedItemActionsMenu({
  onEdit,
  onDelete,
  onSetStatus,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onSetStatus: (status: PlannedItemStatus) => void;
}) {
  const { t } = useI18n();
  return (
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
          onSelect: () => onSetStatus(PlannedItemStatuses.Done),
        },
        {
          label: t.planning.markCancelled,
          icon: <Ban className="size-4" />,
          onSelect: () => onSetStatus(PlannedItemStatuses.Cancelled),
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
  );
}
