"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { IconButton } from "@/components/shared/icon-button";
import { DropdownMenu } from "@/components/ui/dropdown-menu/DropdownMenu";

export function OneTimeMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
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
