"use client";

import {
  CalendarOff,
  MoreVertical,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { IconButton } from "@/components/shared/icon-button";
import { DropdownMenu } from "@/components/ui/dropdown-menu/DropdownMenu";

export function SourceMenu({
  ended,
  onEdit,
  onEnd,
  onReactivate,
  onDelete,
}: {
  ended: boolean;
  onEdit: () => void;
  onEnd: () => void;
  onReactivate: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  return (
    <DropdownMenu
      align="end"
      trigger={
        <IconButton label={t.common.more}>
          <MoreVertical />
        </IconButton>
      }
      items={[
        { label: t.income.edit, icon: <Pencil />, onSelect: onEdit },
        ended
          ? {
              label: t.income.reactivate,
              icon: <RotateCcw />,
              onSelect: onReactivate,
            }
          : { label: t.income.end, icon: <CalendarOff />, onSelect: onEnd },
        { kind: "separator" as const },
        {
          label: t.income.deleteSource,
          icon: <Trash2 />,
          onSelect: onDelete,
          variant: "danger" as const,
        },
      ]}
    />
  );
}
